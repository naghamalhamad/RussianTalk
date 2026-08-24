import { supabase } from './supabaseClient.js';

export function signUp(email, password) {
  return supabase.auth.signUp({ email, password });
}

export function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export function signOut() {
  return supabase.auth.signOut();
}

// Calls onChange(session) once immediately with whoever is already logged
// in (or null), then again every time that changes (login, logout, token
// refresh). Returns an unsubscribe function.
export function subscribeToAuthChanges(onChange) {
  supabase.auth.getSession().then(({ data }) => onChange(data.session));
  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    onChange(session);
  });
  return () => listener.subscription.unsubscribe();
}
