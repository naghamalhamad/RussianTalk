import { useState } from 'react';
import SpeakerButton from './SpeakerButton.jsx';
import { TOPICS } from '../data.js';

export default function FlashcardTicket({ card, showTopicIcon, onDelete }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className={`ticket ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped((f) => !f)}>
      <div className="stub">
        <span>{showTopicIcon ? TOPICS.find((t) => t.id === card.topicId)?.icon : 'RU'}</span>
        <button
          className="delete-btn"
          title="Remove flashcard"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(card.word);
          }}
        >
          ✕
        </button>
      </div>
      <div className="ticket-flip">
        <div className="ticket-flip-inner">
          <div className="ticket-face ticket-front">
            <span className="word">{card.word}</span>
            <SpeakerButton text={card.word} label={`Play "${card.word}"`} className="ticket-speak-btn" />
          </div>
          <div className="ticket-face ticket-back">
            <span className="tr">{card.tr}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
