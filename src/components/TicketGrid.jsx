import EmptyState from './EmptyState.jsx';
import FlashcardTicket from './FlashcardTicket.jsx';

export default function TicketGrid({ cards, showTopicIcon = false, emptyTitle, emptyBody, onDelete }) {
  if (!cards.length) return <EmptyState title={emptyTitle} body={emptyBody} />;
  return (
    <div className="ticket-grid">
      {cards.map((c, i) => (
        <FlashcardTicket key={`${c.word}-${i}`} card={c} showTopicIcon={showTopicIcon} onDelete={onDelete} />
      ))}
    </div>
  );
}
