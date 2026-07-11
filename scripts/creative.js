const SUPABASE_URL = 'https://nxkezfnduhksbjyikjlh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_SOSRHkWaxPz_u7ADqdf53Q_uCtK9JR2';
const BUCKET_NAME = 'Stories';
const SIGNED_URL_TIMEFRAME_SECONDS = 3600;

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
        errorMsg.textContent = error.message;
        errorMsg.style.display = 'block';
    } else {
        // Success!
        errorMsg.style.display = 'none';
        document.getElementById('auth-gate').style.display = 'none';
        document.getElementById('explorer-content').style.display = 'block';
        
        fetchFolderFiles('Short Stories');
    }
}

document.getElementById('login-button').onclick = handleLogin;

async function fetchFolderFiles(folderName)
{
    const fileListUI = document.getElementById('file-list');
    
    const { data: files, error: listError } = await supabaseClient
        .storage
        .from(BUCKET_NAME)
        .list(folderName, { sortBy: { column: 'name', order: 'asc' } });

    if (listError) {
        fileListUI.innerHTML = `<li>Error listing files: ${listError.message}</li>`;
        return;
    }

    // No files there?
    if (!files || files.length === 0) {
        fileListUI.innerHTML = `<li>No files found in this bucket.</li>`;
        return;
    }

    fileListUI.innerHTML = ''; // Clear the "Loading..." placeholder

    // get a temporary link for each file
    for (const file of files) {

        // Ignore empty placeholder files by supabase
        if (file.name === '.emptyFolderPlaceholder') {continue;}

        //console.log(file.name);

        const { data: signedData, error: urlError } = await supabaseClient
            .storage
            .from(BUCKET_NAME)
            .createSignedUrl(`${folderName}/${file.name}`, SIGNED_URL_TIMEFRAME_SECONDS);

        const listItem = document.createElement('li');
        
        if (urlError) {
            // Fail
            console.error("URL Generation Error for", file.name, urlError);
            listItem.textContent = `${file.name} (Error generating link)`;
        } else {
            // Success: Show a clickable link to the file
            listItem.innerHTML = `<a href="${signedData.signedUrl}" target="_blank">📄 ${file.name}</a>`;
        }
                
        fileListUI.appendChild(listItem);
    }
}
