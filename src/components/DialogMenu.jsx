import { DIALOGS } from '../data.js';
import { cardsForDialog } from '../selectors.js';

export default function DialogMenu({ topic, currentDialogId, flashcards, onOpenDialog }) {
  return (
    <nav className="dialog-menu">
      <div className="heading">Dialogs</div>
      {!topic.dialogs.length ? (
        <div style={{ padding: 14, fontSize: 13, color: 'var(--ink-soft)' }}>Nothing here yet.</div>
      ) : (
        topic.dialogs.map((did) => {
          const d = DIALOGS[did];
          const count = cardsForDialog(flashcards, did).length;
          return (
            <button
              key={did}
              className={`dialog-item ${did === currentDialogId ? 'active' : ''}`}
              onClick={() => onOpenDialog(did)}
            >
              <span>{d.title}</span>
              {count > 0 && <span className="badge">{count}</span>}
            </button>
          );
        })
      )}
    </nav>
  );
}
