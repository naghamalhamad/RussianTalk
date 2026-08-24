import { supabase } from './supabaseClient.js';

// Row Level Security policies on the `flashcards` table already restrict
// every one of these queries to the current student's own rows, so none of
// them need to filter by user_id themselves (except the insert, which has
// to say whose row it is).

// select('*') on purpose, not a named column list: this lets old rows keep
// loading even before the `type` column below exists in the database, so a
// student's word flashcards never break while the sentence-flashcard feature
// is waiting on its one-time database update (see the SQL file next to this
// change). Once that column exists, it just comes back as part of the row.
export function loadFlashcards() {
  return supabase.from('flashcards').select('*').order('created_at');
}

export function addFlashcard({ userId, word, translation, dialogId, topicId, type }) {
  const row = { user_id: userId, word, translation, dialog_id: dialogId, topic_id: topicId };
  // Only sentence saves send `type` - word saves keep the exact same insert
  // shape as before, so they don't depend on the `type` column existing yet.
  if (type === 'sentence') row.type = 'sentence';
  return supabase.from('flashcards').insert(row);
}

export function removeFlashcard(word, type = 'word') {
  let query = supabase.from('flashcards').delete().eq('word', word);
  if (type === 'sentence') query = query.eq('type', 'sentence');
  return query;
}
