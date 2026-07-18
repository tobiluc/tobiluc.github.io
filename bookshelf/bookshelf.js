import { loginUser, isLoggedIn, supabaseClient } from "/auth/supabaseAuth";

const BUCKET_NAME = 'Stories';

//-------------------
// Bookshelf Visuals
//-------------------
// Track the selected table/category
let selectedTable = 'ShortStories';
const spineColors = ['#a33535', '#2c5282', '#2f855a', '#b7791f', '#6b46c1', '#4a5568'];

function switchTable(tableName, displayName)
{
    selectedTable = tableName;
    
    // Update the visible title
    document.getElementById('selected-shelf-title').textContent = displayName;
    
    // Update button active states visually
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => {
        const isCurrent = btn.getAttribute('data-table-name') === tableName;
        btn.classList.toggle('active', isCurrent);
    });
    
    // Redraw the shelf after switching datatable
    renderBookshelf();
}

async function renderBookshelf()
{
    const shelf = document.getElementById('selected-shelf');
    const tooltip = document.getElementById('book-tooltip');
    
    shelf.innerHTML = '<div style="color: gray; padding: 20px;">Changing shelves...</div>';

    // Query
    const { data: stories, error } = await supabaseClient
        .from(selectedTable)
        .select('title, date, filename, description')
        .order('date', {ascending: true});

    // Error?
    if (error) {
        shelf.innerHTML = `Error: ${error.message}`;
        return;
    }

    // No books here?
    if (!stories || stories.length === 0) {
        shelf.innerHTML = '<div style="color: #888; padding: 40px; font-style: italic;">Es herrscht gähnende Leere...</div>';
        return;
    }

    // Logged in?
    const loggedIn = await isLoggedIn();

    shelf.innerHTML = ''; // Clear indicator

    // Render the filtered list of books
    stories.forEach((story, index) => 
    {
        const book = document.createElement('button');
        book.classList.add('book-spine');
        
        const randomHeight = Math.floor(Math.random() * (170 - 140 + 1)) + 140;
        book.style.height = `${randomHeight}px`;
        book.style.textDecoration = 'none';
        book.innerHTML = `<div class="book-title-vertical" title="${story.title}">${story.title}</div>`;

        
        if (loggedIn) {
            book.style.backgroundColor = spineColors[index % spineColors.length];
        } else {
            book.classList.add('locked');
        }

        // visual hover logic -> Change Tooltip Text
        book.onmouseenter = () =>
        {
            const statusSymbol = loggedIn ? 'Lesen' : 'Einloggen';
            const yearText = story.date ? ` (${new Date(story.date).getFullYear()})` : '';
            tooltip.innerHTML = `<strong>${story.title}</strong>${yearText} | <span style="color: #b7791f">${statusSymbol}</span> <p>${story.description ? story.description : ''}</p>`;
        };

        book.onmouseleave = () => {
            tooltip.innerHTML = `Klick auf ein "Buch", um es zu lesen.`;
        };

        //Handle the DB fetch and opening file
        book.onclick = async () =>
        {
            // If a user is not logged in and tries to click on a file
            // we send the user to the login screen
            if (!loggedIn) {
                window.location.href = '/auth/';
                return;
            }

            const newTab = window.open('about:blank', '_blank');

            // Some visual cues that the file is loading
            book.style.opacity = '0.5';
            const originalText = tooltip.innerHTML;
            tooltip.innerHTML = `<em>Öffne Dokument...</em>`;

            try {
                // Grab the secure tokenized link
                const { data, error } = await supabaseClient
                    .storage
                    .from(BUCKET_NAME)
                    .createSignedUrl(`${selectedTable}/${story.filename}`, 10);
                if (error) {throw error;}

                // Open in a new tab
                if (data?.signedUrl) {
                    newTab.location.href = data.signedUrl;
                }
            } catch (err) {
                tooltip.innerHTML = `<span style="color: red">${err}</span>`;
            } finally {
                book.style.opacity = '1';
                tooltip.innerHTML = originalText;
            }
        };

        shelf.appendChild(book);
    });
}

document.addEventListener('DOMContentLoaded', () =>
{
    // Handle switching of categories (short stories, detective ronny etc.)
    const navButtons = document.querySelectorAll('.category-nav .nav-btn');
    navButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        const data = event.currentTarget.dataset;
        switchTable(data.tableName, data.displayName);
    });
    });

    renderBookshelf();
});
