import { supabase } from './supabaseClient.js';

// Row Level Security policies on the `flashcards` table already restrict
// every one of these queries to the current student's own rows, so none of
// them need to filter by user_id themselves (except the insert, which has
// to say whose row it is).

export function loadFlashcards() {
  return supabase.from('flashcards').select('word, translation, dialog_id, topic_id').order('created_at');
}

export function addFlashcard({ userId, word, translation, dialogId, topicId }) {
  return supabase
    .from('flashcards')
    .insert({ user_id: userId, word, translation, dialog_id: dialogId, topic_id: topicId });
}

export function removeFlashcard(word) {
  return supabase.from('flashcards').delete().eq('word', word);
}
