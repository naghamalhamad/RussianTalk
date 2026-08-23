import { useState } from 'react';

export default function TrainingModal({ cards, onClose }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [again, setAgain] = useState(0);

  const done = index >= cards.length;

  function mark(isKnown) {
    if (isKnown) setKnown((k) => k + 1);
    else setAgain((a) => a + 1);
    setFlipped(false);
    setIndex((i) => i + 1);
  }

  return (
    <div className="modal-backdrop">
      <div className="train-modal">
        {done ? (
          <div className="summary">
            <div className="icon" style={{ fontSize: 30 }}>🎟️</div>
            <h3>Session complete</h3>
            <p>
              {cards.length} cards reviewed · {known} marked known · {again} to review again
            </p>
            <button className="close-modal" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="progress">
              Card {index + 1} of {cards.length}
            </div>
            <div className={`flip-card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped((f) => !f)}>
              <span className="side-label">Russian</span>
              <div className="main-word">{cards[index].word}</div>
              <div className="sub-word">{cards[index].tr}</div>
              <div className="flip-hint">Tap to flip</div>
            </div>
            {flipped && (
              <div className="train-controls">
                <button className="btn-again" onClick={() => mark(false)}>Still learning</button>
                <button className="btn-know" onClick={() => mark(true)}>Got it</button>
              </div>
            )}
            <button className="close-modal" onClick={onClose}>End session</button>
          </>
        )}
      </div>
    </div>
  );
}
