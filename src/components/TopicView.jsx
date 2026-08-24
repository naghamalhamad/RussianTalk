import { useEffect, useState } from 'react';
import { TOPICS } from '../data.js';
import DialogMenu from './DialogMenu.jsx';
import ChatPanel from './ChatPanel.jsx';
import TicketGrid from './TicketGrid.jsx';
import EmptyState from './EmptyState.jsx';
import { cardsForDialog, cardsForTopic } from '../selectors.js';

export default function TopicView({ topicId, flashcards, loggedIn, onSaveWord, onRemoveWord, onRequireLogin, onBack, onStartTraining }) {
  const topic = TOPICS.find((t) => t.id === topicId);
  const [tab, setTab] = useState('dialogs');
  const [dialogId, setDialogId] = useState(topic.dialogs[0] ?? null);
  const [scope, setScope] = useState('dialog');

  useEffect(() => {
    setTab('dialogs');
    setDialogId(topic.dialogs[0] ?? null);
    setScope('dialog');
  }, [topicId]);

  const topicCardCount = cardsForTopic(flashcards, topicId).length;
  const scopedCards = scope === 'dialog' ? cardsForDialog(flashcards, dialogId) : cardsForTopic(flashcards, topicId);

  return (
    <section>
      <div className="back-row">
        <button className="back-btn" onClick={onBack}>← Topics</button>
      </div>
      <h2 className="topic-title">
        {topic.icon} {topic.title} <span className="ru">{topic.ru}</span>
      </h2>

      <div className="topic-tabs">
        <button className={`topic-tab ${tab === 'dialogs' ? 'active' : ''}`} onClick={() => setTab('dialogs')}>
          Dialogs
        </button>
        <button className={`topic-tab ${tab === 'cards' ? 'active' : ''}`} onClick={() => setTab('cards')}>
          Flashcards {topicCardCount > 0 && `(${topicCardCount})`}
        </button>
      </div>

      {tab === 'dialogs' ? (
        <div className="topic-layout">
          <DialogMenu topic={topic} currentDialogId={dialogId} flashcards={flashcards} onOpenDialog={setDialogId} />
          {dialogId ? (
            <ChatPanel
              dialogId={dialogId}
              flashcards={flashcards}
              loggedIn={loggedIn}
              onSaveWord={onSaveWord}
              onRemoveWord={onRemoveWord}
              onRequireLogin={onRequireLogin}
            />
          ) : (
            <div className="chat-panel">
              <EmptyState
                title="No dialogs yet"
                body={`Add your first dialog for "${topic.title}" and it will appear here as a chat.`}
              />
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="fc-toolbar">
            <button className={`chip ${scope === 'dialog' ? 'active' : ''}`} onClick={() => setScope('dialog')}>
              This dialog
            </button>
            <button className={`chip ${scope === 'topic' ? 'active' : ''}`} onClick={() => setScope('topic')}>
              Whole topic
            </button>
            <button className="train-btn" onClick={() => onStartTraining(scopedCards)}>
              Train ▸
            </button>
          </div>
          <TicketGrid
            cards={scopedCards}
            onDelete={onRemoveWord}
            emptyTitle="No flashcards yet"
            emptyBody="Save a word from a dialog and it will show up here as a ticket."
          />
        </div>
      )}
    </section>
  );
}
