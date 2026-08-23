export function cardsForDialog(flashcards, dialogId) {
  return flashcards.filter((f) => f.dialogId === dialogId);
}

export function cardsForTopic(flashcards, topicId) {
  return flashcards.filter((f) => f.topicId === topicId);
}
