import { useState } from 'react';
import TopBar from './components/TopBar.jsx';
import Home from './components/Home.jsx';
import TopicView from './components/TopicView.jsx';
import GlobalFlashcards from './components/GlobalFlashcards.jsx';
import TrainingModal from './components/TrainingModal.jsx';
import { INITIAL_FLASHCARDS } from './data.js';

export default function App() {
  const [view, setView] = useState('home'); // 'home' | 'topic' | 'global'
  const [topicId, setTopicId] = useState(null);
  const [flashcards, setFlashcards] = useState(INITIAL_FLASHCARDS);
  const [trainingCards, setTrainingCards] = useState(null);

  function saveWord({ word, tr, dialogId, topicId: wordTopicId }) {
    setFlashcards((prev) =>
      prev.some((f) => f.word === word && f.dialogId === dialogId)
        ? prev
        : [...prev, { word, tr, dialogId, topicId: wordTopicId }]
    );
  }

  function removeWord(dialogId, word) {
    setFlashcards((prev) => prev.filter((f) => !(f.word === word && f.dialogId === dialogId)));
  }

  function startTraining(cards) {
    if (cards.length) setTrainingCards(cards);
  }

  return (
    <div className="app">
      <TopBar
        view={view}
        flashcardCount={flashcards.length}
        onHome={() => setView('home')}
        onFlashcards={() => setView('global')}
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
      </main>
      {trainingCards && <TrainingModal cards={trainingCards} onClose={() => setTrainingCards(null)} />}
    </div>
  );
}
