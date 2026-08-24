import EmptyState from './EmptyState.jsx';
import { TOPICS } from '../data.js';

export default function TicketGrid({ cards, showTopicIcon = false, emptyTitle, emptyBody, onDelete }) {
  if (!cards.length) return <EmptyState title={emptyTitle} body={emptyBody} />;
  return (
    <div className="ticket-grid">
      {cards.map((c, i) => {
        const type = c.type ?? 'word';
        return (
          <div className="ticket" key={`${type}-${c.word}-${i}`}>
            <div className="stub">
              <span>{showTopicIcon ? TOPICS.find((t) => t.id === c.topicId)?.icon : 'RU'}</span>
              <span className={`card-type ${type === 'sentence' ? 'is-sentence' : 'is-word'}`}>
                {type === 'sentence' ? 'Sentence' : 'Word'}
              </span>
              <button className="delete-btn" title="Remove flashcard" onClick={() => onDelete(c.word, type)}>
                ✕
              </button>
            </div>
            <span className="word">{c.word}</span>
            <div className="tr">{c.tr}</div>
          </div>
        );
      })}
    </div>
  );
}
