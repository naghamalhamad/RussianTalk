export default function EmptyState({ title, body }) {
  return (
    <div className="empty-state">
      <div className="icon">✎</div>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}
