import { supabase } from './supabaseClient.js';

// Login is ID-only now - no password field shown anywhere in the UI. Under
// the hood Supabase Auth still needs an email + password pair (that's what
// the whole flashcard-security model in the database is built on), so every
// student's account silently shares this one fixed password, and their
// chosen ID is turned into a fake, never-emailed address. This is an
// intentional, explicit tradeoff, not a shortcut - see ARCHITECTURE.md,
// "How ID-Only Login Works", for the full explanation and why it must stay
// this way.
const SHARED_PASSWORD = 'rustalk-student-account-2026';

// Turns a student-chosen ID like "Nagham_92" into a stable fake email
// Supabase Auth can use as the account's identity. Returns null if nothing
// usable is left after stripping characters an email can't contain.
export function idToEmail(id) {
  const clean = id.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  return clean ? `${clean}@id.rustalk.local` : null;
}

// One entry point for both "log in" and "sign up", because from the
// student's point of view there is no difference - they just type their ID.
// The first person to use an ID claims it (this is where the account is
// actually created); everyone after that who types the same ID logs into
// that same account, since the password behind the scenes is the same for
// everyone. That also means anyone who knows or guesses another student's
// ID can log in as them - an accepted tradeoff for a low-stakes classroom
// setting, not a bug.
export async function signInWithId(id) {
  const email = idToEmail(id);
  if (!email) {
    return { error: { message: 'Please use letters, numbers, - or _ for your ID.' } };
  }

  const signInResult = await supabase.auth.signInWithPassword({ email, password: SHARED_PASSWORD });
  if (!signInResult.error) return signInResult;

  const signUpResult = await supabase.auth.signUp({ email, password: SHARED_PASSWORD });
  if (signUpResult.error) return signUpResult;

  // Supabase created the account but didn't hand back a session - the only
  // way that happens here is if the project still has "Confirm email"
  // switched on, which can never succeed for these fake, never-delivered
  // addresses. That's a one-time dashboard setting, not something this code
  // can fix - see ARCHITECTURE.md, "How ID-Only Login Works".
  if (!signUpResult.data?.session) {
    return {
      error: {
        message:
          "Couldn't log you in automatically. Ask whoever runs this site to turn off \"Confirm email\" under Supabase → Authentication → Providers → Email.",
      },
    };
  }

  return signUpResult;
}

// The reverse of idToEmail, for displaying "signed in as ___" - turns the
// fake email back into the ID a student would recognize as their own.
export function emailToId(email) {
  return email?.replace(/@id\.rustalk\.local$/, '') ?? '';
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
