import { useEffect, useState } from 'react';
import TopBar from './components/TopBar.jsx';
import Home from './components/Home.jsx';
import TopicView from './components/TopicView.jsx';
import GlobalFlashcards from './components/GlobalFlashcards.jsx';
import TrainingModal from './components/TrainingModal.jsx';
import AccountView from './components/AccountView.jsx';
import { subscribeToAuthChanges } from './auth.js';
import { addFlashcard, loadFlashcards, removeFlashcard } from './flashcardsApi.js';

export default function App() {
  const [view, setView] = useState('home'); // 'home' | 'topic' | 'global' | 'account'
  const [topicId, setTopicId] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [trainingCards, setTrainingCards] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => subscribeToAuthChanges(setSession), []);

  const userId = session?.user?.id ?? null;

  // Load this student's saved words whenever who's logged in changes (not on
  // every session refresh - only when the actual logged-in user changes).
  useEffect(() => {
    if (!userId) {
      setFlashcards([]);
      return;
    }
    let cancelled = false;
    loadFlashcards().then(({ data, error }) => {
      if (cancelled || error) return;
      setFlashcards(
        data.map((row) => ({
          word: row.word, tr: row.translation, dialogId: row.dialog_id, topicId: row.topic_id,
          // Rows saved before the `type` column existed (or the column not
          // existing yet at all) are word flashcards - that was the only kind.
          type: row.type ?? 'word',
        }))
      );
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Shared by both word flashcards and sentence flashcards - `type` is the
  // only thing that tells them apart. A word flashcard's `word` field holds
  // a single Russian word; a sentence flashcard's holds the whole sentence.
  async function saveCard({ word, tr, dialogId, topicId: cardTopicId, type = 'word' }) {
    if (!userId || flashcards.some((f) => f.word === word && f.type === type)) return;
    setFlashcards((prev) => [...prev, { word, tr, dialogId, topicId: cardTopicId, type }]);
    const { error } = await addFlashcard({ userId, word, translation: tr, dialogId, topicId: cardTopicId, type });
    // Ignore "already saved" conflicts (code 23505) - that's a harmless race,
    // not a real failure. Roll back the optimistic update for anything else.
    if (error && error.code !== '23505') {
      setFlashcards((prev) => prev.filter((f) => !(f.word === word && f.type === type)));
    }
  }

  async function removeCard(word, type = 'word') {
    if (!userId) return;
    const removed = flashcards.find((f) => f.word === word && f.type === type);
    setFlashcards((prev) => prev.filter((f) => !(f.word === word && f.type === type)));
    const { error } = await removeFlashcard(word, type);
    if (error && removed) {
      setFlashcards((prev) => [...prev, removed]);
    }
  }

  function startTraining(cards) {
    if (cards.length) setTrainingCards(cards);
  }

  return (
    <div className="app">
      <TopBar
        view={view}
        session={session}
        flashcardCount={flashcards.length}
        onHome={() => setView('home')}
        onFlashcards={() => setView('global')}
        onAccount={() => setView('account')}
      />
      <main>
        {view === 'home' && (
          <Home
            flashcards={flashcards}
            onOpenTopic={(id) => {
              setTopicId(id);
              setView('topic');
            }}
          />
        )}
        {view === 'topic' && (
          <TopicView
            topicId={topicId}
            flashcards={flashcards}
            loggedIn={!!userId}
            onSaveCard={saveCard}
            onRemoveCard={removeCard}
            onRequireLogin={() => setView('account')}
            onBack={() => setView('home')}
            onStartTraining={startTraining}
          />
        )}
        {view === 'global' && (
          <GlobalFlashcards
            flashcards={flashcards}
            onRemoveCard={removeCard}
            onBack={() => setView('home')}
            onStartTraining={startTraining}
          />
        )}
        {view === 'account' && <AccountView session={session} onBack={() => setView('home')} />}
      </main>
      {trainingCards && <TrainingModal cards={trainingCards} onClose={() => setTrainingCards(null)} />}
    </div>
  );
}
