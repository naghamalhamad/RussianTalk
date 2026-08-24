import { useEffect, useState } from 'react';
import TopBar from './components/TopBar.jsx';
import Home from './components/Home.jsx';
import TopicView from './components/TopicView.jsx';
import GlobalFlashcards from './components/GlobalFlashcards.jsx';
import TrainingModal from './components/TrainingModal.jsx';
import AccountView from './components/AccountView.jsx';
import { subscribeToAuthChanges } from './auth.js';
import { INITIAL_FLASHCARDS } from './data.js';

export default function App() {
  const [view, setView] = useState('home'); // 'home' | 'topic' | 'global' | 'account'
  const [topicId, setTopicId] = useState(null);
  const [flashcards, setFlashcards] = useState(INITIAL_FLASHCARDS);
  const [trainingCards, setTrainingCards] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => subscribeToAuthChanges(setSession), []);

  function saveWord({ word, tr, dialogId, topicId: wordTopicId }) {
    setFlashcards((prev) => (prev.some((f) => f.word === word) ? prev : [...prev, { word, tr, dialogId, topicId: wordTopicId }]));
  }

  function removeWord(word) {
    setFlashcards((prev) => prev.filter((f) => f.word !== word));
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
            onSaveWord={saveWord}
            onRemoveWord={removeWord}
            onBack={() => setView('home')}
            onStartTraining={startTraining}
          />
        )}
        {view === 'global' && (
          <GlobalFlashcards
            flashcards={flashcards}
            onRemoveWord={removeWord}
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
