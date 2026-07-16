import { loginUser, isLoggedIn, supabaseClient } from "../src/js/supabaseAuth";

const BUCKET_NAME = 'Stories';

async function handleLogin()
{
    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    const errorMsg = document.getElementById('error-msg');

    try {
        const data = await loginUser(email, password);
        errorMsg.style.display = 'none';
        document.getElementById('auth-gate').style.display = 'none';
        for (const shelf of document.getElementsByClassName('bookshelf')) {
            shelf.style.display = 'block';
        }
        renderBookshelf();
    } catch (error) {
        // Login Fail
        errorMsg.textContent = error.message;
        errorMsg.style.display = 'block';
    }
}

document.getElementById('login-button').onclick = handleLogin;

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
        if (btn.textContent.includes(displayName)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
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
        const book = document.createElement('a');
        book.classList.add('book-spine');

        book.target = '_blank';
        book.rel = 'noopener noreferrer';
        book.href = '#';
        
        const randomHeight = 140 + (index % 4) * 10;
        book.style.height = `${randomHeight}px`;
        book.style.textDecoration = 'none';

        if (loggedIn) {
            book.style.backgroundColor = spineColors[index % spineColors.length];
        } else {
            book.classList.add('locked');
        }

        book.innerHTML = `<div class="book-title-vertical">${story.title}</div>`;

        book.onmouseenter = async () =>
        {
            const statusSymbol = isLoggedIn ? 'Lesen' : 'Einloggen';
            const yearText = story.date ? ` (${new Date(story.date).getFullYear()})` : '';
            tooltip.innerHTML = `<strong>${story.title}</strong>${yearText} | <span style="color: #b7791f">${statusSymbol}</span> <p>${story.description? story.description : ''}</p>`;

            // grab the secure tokenized link in the background
            // so when we click we go to the file
            const { data } = await supabaseClient
                .storage
                .from(BUCKET_NAME)
                .createSignedUrl(`${selectedTable}/${story.filename}`, 30);

            if (data?.signedUrl) {
                book.href = data.signedUrl;
            }
        };

        book.onmouseleave = () => {
            tooltip.innerHTML = `Klick auf ein "Buch", um es zu lesen.`;
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
});

// Initial load when page first boots up
// window.onload = () => {
//     renderBookshelf();
// };
