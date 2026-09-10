import { createClient, Session, AuthChangeEvent } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function loginUser(email: string, password: string) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

export async function isLoggedIn(): Promise<boolean> {
    const {
        data: { session },
        error,
    } = await supabaseClient.auth.getSession();
    if (error) {
        console.error(error.message);
        return false;
    }
    return session !== null;
}

export async function logoutUser(): Promise<void> {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
}

export type AuthChangeCallback = (
    event: AuthChangeEvent,
    session: Session | null,
    loggedIn: boolean
) => void;

export function onAuthStateChange(callback: AuthChangeCallback): () => void {
    const {
        data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
        const loggedIn = session !== null;
        callback(event, session, loggedIn);
    });
    return () => subscription.unsubscribe();
}

// async function sha256(string)
// {
//     const utf8 = new TextEncoder().encode(string);
//     const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
//     const hashArray = Array.from(new Uint8Array(hashBuffer));
//     return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
// } 
