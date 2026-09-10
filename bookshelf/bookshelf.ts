import { isLoggedIn, supabaseClient } from "../auth/supabaseAuth";
import { queryItems, IBookItem, TableName } from "./BookItem";

const BUCKET_NAME = 'Stories';
const SELECTED_CLASS = 'selected';

//-------------------
// Bookshelf Visuals
//-------------------
let selectedTable: TableName = 'ShortStories';
const spineColors = ['#a33535', '#2c5282', '#2f855a', '#b7791f', '#6b46c1', '#4a5568'];

// Carousel state
let currentItems: IBookItem[] = [];
let currentIndex = 0;
let scrollRaf = 0;
let resizeObserver: ResizeObserver | null = null;

function getShelfElements() {
    const scroller = document.getElementById('selected-shelf') as HTMLElement | null;
    const track = document.getElementById('shelf-track') as HTMLElement | null;
    const info = document.getElementById('book-info') as HTMLElement | null;
    const prevBtn = document.getElementById('shelf-prev') as HTMLButtonElement | null;
    const nextBtn = document.getElementById('shelf-next') as HTMLButtonElement | null;
    return { scroller, track, info, prevBtn, nextBtn };
}

function switchTable(tableName: TableName, displayName: string): void {
    selectedTable = tableName;

    const titleEl = document.getElementById('selected-shelf-title');
    if (titleEl) {
        titleEl.textContent = displayName;
    }

    document.querySelectorAll<HTMLElement>('.nav-btn').forEach((btn) => {
        const isCurrent = btn.getAttribute('data-table-name') === tableName;
        btn.classList.toggle('active', isCurrent);
    });

    void renderBookshelf();
}

/**
 * Adds leading/trailing spacer elements so the first and last book
 * can still be scrolled into the dead-center of the container.
 */
// function sizeSpacers(scroller: HTMLElement, track: HTMLElement): void {
//     const firstBook = track.querySelector<HTMLElement>('.book-spine');
//     if (!firstBook) return;

//     const bookWidth = firstBook.getBoundingClientRect().width;
//     const spacerWidth = Math.max(0, (scroller.clientWidth - bookWidth) / 2);

//     track.style.setProperty('--spacer-width', `${spacerWidth}px`);
// }
/**
 * Dynamically sizes leading and trailing spacer elements to allow 
 * centering the first and last items in the carousel viewport.
 */
function updateSpacers(scroller: HTMLElement, track: HTMLElement): void {
    const books = track.querySelectorAll<HTMLElement>('.book-spine');
    if (books.length === 0) return;

    const firstBook = books[0];
    const bookWidth = firstBook.getBoundingClientRect().width || 60; // fallback to CSS width
    const spacerWidth = Math.max(0, (scroller.clientWidth - bookWidth) / 2);

    let startSpacer = track.querySelector<HTMLElement>('.shelf-spacer-start');
    let endSpacer = track.querySelector<HTMLElement>('.shelf-spacer-end');

    if (startSpacer) startSpacer.style.flex = `0 0 ${spacerWidth}px`;
    if (endSpacer) endSpacer.style.flex = `0 0 ${spacerWidth}px`;
}

function updateInfoPanel(info: HTMLElement, item: IBookItem, loggedIn: boolean): void {
    if (!item) {return;}
    info.innerHTML = item.getTooltipHTML();
}

/** Finds the book-spine element whose center is closest to the scroller's center. */
function findClosestIndex(scroller: HTMLElement, books: HTMLElement[]): number {
    const scrollerCenter = scroller.getBoundingClientRect().left + scroller.clientWidth / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    books.forEach((book, index) => {
        const bookCenter = book.getBoundingClientRect().left + book.clientWidth / 2;
        const distance = Math.abs(bookCenter - scrollerCenter);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
        }
    });

    return closestIndex;
}

function applySelectionStyles(books: HTMLElement[], index: number): void {
    books.forEach((book, i) => {
        book.classList.toggle(SELECTED_CLASS, i === index);
        book.setAttribute('aria-current', i === index ? 'true' : 'false');
    });
}

function handleScroll(scroller: HTMLElement, info: HTMLElement, loggedIn: boolean): void {
    if (scrollRaf) return;

    scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;

        const books = Array.from(scroller.querySelectorAll<HTMLElement>('.book-spine'));
        if (books.length === 0) return;

        const closest = findClosestIndex(scroller, books);
        if (closest !== currentIndex) {
            currentIndex = closest;
            applySelectionStyles(books, currentIndex);
            const item = currentItems[currentIndex];
            if (item) updateInfoPanel(info, item, loggedIn);
        }
    });
}

function scrollToIndex(scroller: HTMLElement, books: HTMLElement[], index: number): void {
    const clamped = Math.max(0, Math.min(index, books.length - 1));
    books[clamped]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

async function renderBookshelf(): Promise<void> {
    const { scroller, track, info, prevBtn, nextBtn } = getShelfElements();
    if (!scroller || !track || !info) return;

    resizeObserver?.disconnect();
    currentIndex = 0;

    track.innerHTML = '<div style="color: gray; padding: 20px;">Changing shelves...</div>';

    const { items, error } = await queryItems(selectedTable);
    if (error || items.length === 0) {
        track.innerHTML = error ? `Error: ${error.message}` : '<div style="color: #888; padding: 40px; font-style: italic;">Es herrscht gähnende Leere...</div>';
        return;
    }

    currentItems = items;
    const loggedIn = await isLoggedIn();

    track.innerHTML = '';

    // Create Start Spacer
    const startSpacer = document.createElement('div');
    startSpacer.classList.add('shelf-spacer-start');
    track.appendChild(startSpacer);

    // Create Book Spines
    items.forEach((item: IBookItem, index: number) => {
        const book = document.createElement('div');
        book.classList.add('book-spine');
        book.setAttribute('role', 'button');
        book.setAttribute('tabindex', '0');

        const randomHeight = Math.floor(Math.random() * (170 - 140 + 1)) + 140;
        book.style.height = `${randomHeight}px`;
        book.innerHTML = `<div class="book-title-vertical" title="${item.title}">${item.title}</div>`;

        if (loggedIn) {
            book.style.backgroundColor = spineColors[index % spineColors.length];
        } else {
            book.classList.add('locked');
        }

        const handleClick = async () => {
            const books = Array.from(track.querySelectorAll<HTMLElement>('.book-spine'));
            if (index !== currentIndex) {
                scrollToIndex(scroller, books, index);
            } else {
                await openBook(item, book, info);
            }
        };

        book.addEventListener('click', () => void handleClick());
        book.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                void handleClick();
            }
        });

        track.appendChild(book);
    });

    // Create End Spacer
    const endSpacer = document.createElement('div');
    endSpacer.classList.add('shelf-spacer-end');
    track.appendChild(endSpacer);

    const books = Array.from(track.querySelectorAll<HTMLElement>('.book-spine'));

    // Compute spacers & initial selection
    updateSpacers(scroller, track);
    applySelectionStyles(books, currentIndex);
    updateInfoPanel(info, items[currentIndex], loggedIn);

    // Re-measure spacers when the viewport size changes
    resizeObserver = new ResizeObserver(() => updateSpacers(scroller, track));
    resizeObserver.observe(scroller);

    scroller.onscroll = () => handleScroll(scroller, info, loggedIn);

    if (prevBtn) prevBtn.onclick = () => scrollToIndex(scroller, books, currentIndex - 1);
    if (nextBtn) nextBtn.onclick = () => scrollToIndex(scroller, books, currentIndex + 1);
}

async function openBook(item: IBookItem, book: HTMLElement, info: HTMLElement): Promise<void> {
    const loggedIn = await isLoggedIn();
    if (!loggedIn) {
        window.location.href = '/auth/';
        return;
    }

    const newTab = window.open('about:blank', '_blank');

    book.style.opacity = '0.5';
    const originalInfo = info.innerHTML;
    info.innerHTML = `<em>Öffne Dokument...</em>`;

    try {
        const { data, error: urlError } = await supabaseClient.storage
            .from(BUCKET_NAME)
            .createSignedUrl(`${selectedTable}/${item.filename}`, 10);
        if (urlError) throw urlError;

        if (data?.signedUrl && newTab) {
            newTab.location.href = data.signedUrl;
        }
    } catch (err) {
        info.innerHTML = `<span style="color: red">${err}</span>`;
        return;
    } finally {
        book.style.opacity = '1';
    }

    info.innerHTML = originalInfo;
}

document.addEventListener('DOMContentLoaded', () => {
    // const navButtons = document.querySelectorAll<HTMLElement>('.category-nav .nav-btn');
    // navButtons.forEach((button) => {
    //     button.addEventListener('click', (event) => {
    //         const target = event.currentTarget as HTMLElement;
    //         const data = target.dataset;
    //         switchTable((data.tableName as TableName) ?? selectedTable, data.displayName ?? '');
    //     });
    // });
    const categorySelect = document.getElementById('category-select') as HTMLSelectElement | null;

    if (categorySelect) {
        categorySelect.addEventListener('change', (event: Event) => {
            const target = event.target as HTMLSelectElement;
            const selectedOption = target.options[target.selectedIndex];

            const tableName = target.value as TableName;
            const displayName = selectedOption.getAttribute('data-display-name') || '';

            switchTable(tableName, displayName);
        });
    }

    void renderBookshelf();
});
