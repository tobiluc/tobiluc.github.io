import { loginUser, logoutUser, isLoggedIn, onAuthStateChange, supabaseClient } from "./supabaseAuth";

document.addEventListener('DOMContentLoaded', async () =>
{
    // Hide/Unhide Login Window based on logged in status
    const unsubscribe = onAuthStateChange((event, session, loggedIn) => {
        console.log(`Auth Event: ${event}`);
    
        if (loggedIn)
        {
            document.getElementById('auth-gate').style.display = 'none';
            const userCard = document.getElementById('user-card');
            userCard.style.display = 'block';
            document.getElementById('user-hello').textContent = "Hello, "+session.user.email;
        } else {
            document.getElementById('auth-gate').style.display = 'block';
            document.getElementById('user-card').style.display = 'none';
        }
    });

    // Handle Login
    const errorMsg = document.getElementById('error-msg');
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async (event) =>
    {
        event.preventDefault(); // prevent page from reloading
        try
        {
            const email = document.getElementById('email-input').value;
            const password = document.getElementById('password-input').value;
            const data = await loginUser(email, password);
            errorMsg.style.display = 'none';
            document.getElementById('auth-gate').style.display = 'none';
        } catch (error) {
            errorMsg.textContent = error.message;
            errorMsg.style.display = 'block';
        }
    });

    // Handle Logout
    const logoutButton = document.getElementById('logout-button');
    logoutButton.addEventListener('click', async (event) =>
    {
        try
        {
            const data = await logoutUser();
        } catch (error) {
            console.error(error);
        }
    });

    // cleanup
    window.addEventListener('beforeunload', () => {
        unsubscribe();
    });
});
