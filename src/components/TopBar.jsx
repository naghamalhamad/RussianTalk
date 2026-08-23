export default function TopBar({ view, flashcardCount, onHome, onFlashcards }) {
  return (
    <div className="topbar">
      <button className="brand" onClick={onHome}>
        <span className="mark">Р</span>
        <span>
          <span className="name">RusTalk</span>
          <span className="tag">dialogs for the trip</span>
        </span>
      </button>
      <div className="nav-actions">
        <button className={`nav-btn ${view === 'home' ? 'active' : ''}`} onClick={onHome}>
          Topics
        </button>
        <button className={`nav-btn ${view === 'global' ? 'active' : ''}`} onClick={onFlashcards}>
          Flashcards <span className="count">{flashcardCount}</span>
        </button>
      </div>
    </div>
  );
}
