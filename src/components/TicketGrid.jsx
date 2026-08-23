import EmptyState from './EmptyState.jsx';
import { TOPICS } from '../data.js';

export default function TicketGrid({ cards, showTopicIcon = false, emptyTitle, emptyBody }) {
  if (!cards.length) return <EmptyState title={emptyTitle} body={emptyBody} />;
  return (
    <div className="ticket-grid">
      {cards.map((c, i) => (
        <div className="ticket" key={`${c.word}-${i}`}>
          <div className="stub">
            <span>{showTopicIcon ? TOPICS.find((t) => t.id === c.topicId)?.icon : 'RU'}</span>
            <span>✓</span>
          </div>
          <span className="word">{c.word}</span>
          <div className="tr">{c.tr}</div>
        </div>
      ))}
    </div>
  );
}
