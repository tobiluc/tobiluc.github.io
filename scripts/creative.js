const SUPABASE_URL = 'https://nxkezfnduhksbjyikjlh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_SOSRHkWaxPz_u7ADqdf53Q_uCtK9JR2';
const BUCKET_NAME = 'Stories';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function sha256(string)
{
    const utf8 = new TextEncoder().encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function handleLogin()
{
    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    const errorMsg = document.getElementById('error-msg');

    // Ask Supabase to log the user in using the Users table
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        // Login Fail
        errorMsg.textContent = error.message;
        errorMsg.style.display = 'block';
    } else {
        // Login Success!
        errorMsg.style.display = 'none';
        document.getElementById('auth-gate').style.display = 'none';
        for (const shelf of document.getElementsByClassName('bookshelf')) {
            shelf.style.display = 'block';
        }
        
        // fetchFolderFiles('Short Stories');
        // fetchShortStories();
        renderBookshelf();
    }
}

document.getElementById('login-button').onclick = handleLogin;

//-----------
// Logout
//-----------
// document.getElementById('logout-button').onclick = async () => {
//     await supabaseClient.auth.signOut();
//     // alert("Logged out!");
//     window.location.reload();
// };


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
    const { data: { session } } = await supabaseClient.auth.getSession();
    const isLoggedIn = session !== null;

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

        if (isLoggedIn) {
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

// Initial load when page first boots up
// window.onload = () => {
//     renderBookshelf();
// };
