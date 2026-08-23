import { useState } from 'react';
import { TOPICS } from '../data.js';
import TicketGrid from './TicketGrid.jsx';

export default function GlobalFlashcards({ flashcards, onRemoveWord, onBack, onStartTraining }) {
  const [filter, setFilter] = useState({ type: 'all', id: null });
  const usedTopics = [...new Set(flashcards.map((f) => f.topicId))];

  const cards =
    filter.type === 'all' ? flashcards : flashcards.filter((f) => f.topicId === filter.id);

  return (
    <section>
      <div className="back-row">
        <button className="back-btn" onClick={onBack}>← Topics</button>
      </div>
      <h2 className="topic-title">All flashcards</h2>

      <div className="fc-toolbar">
        <button className={`chip ${filter.type === 'all' ? 'active' : ''}`} onClick={() => setFilter({ type: 'all', id: null })}>
          All ({flashcards.length})
        </button>
        {usedTopics.map((tid) => {
          const t = TOPICS.find((x) => x.id === tid);
          const n = flashcards.filter((f) => f.topicId === tid).length;
          return (
            <button
              key={tid}
              className={`chip ${filter.type === 'topic' && filter.id === tid ? 'active' : ''}`}
              onClick={() => setFilter({ type: 'topic', id: tid })}
            >
              {t.icon} {t.title} ({n})
            </button>
          );
        })}
        <button className="train-btn" onClick={() => onStartTraining(cards)}>
          Train All ▸
        </button>
      </div>

      <TicketGrid
        cards={cards}
        showTopicIcon
        onDelete={onRemoveWord}
        emptyTitle="No flashcards yet"
        emptyBody="Words you save from any dialog will collect here."
      />
    </section>
  );
}
