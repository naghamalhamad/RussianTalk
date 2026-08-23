import { useEffect, useRef, useState } from 'react';
import { DIALOGS } from '../data.js';

function BubbleWords({ line, dialogId, topicId, savedWords, onWordClick }) {
  if (!line.words.length) return line.ru;

  // Split the sentence around each annotated word so only those words become
  // clickable spans, matching the ordering / punctuation of the original text.
  const segments = [{ text: line.ru, isWord: false }];
  line.words.forEach(([w, tr]) => {
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i];
      if (seg.isWord) continue;
      const idx = seg.text.indexOf(w);
      if (idx === -1) continue;
      const before = seg.text.slice(0, idx);
      const after = seg.text.slice(idx + w.length);
      const replacement = [];
      if (before) replacement.push({ text: before, isWord: false });
      replacement.push({ text: w, isWord: true, tr });
      if (after) replacement.push({ text: after, isWord: false });
      segments.splice(i, 1, ...replacement);
      break;
    }
  });

  return segments.map((seg, i) =>
    seg.isWord ? (
      <span
        key={i}
        className={`word ${savedWords.has(seg.text) ? 'saved' : ''}`}
        onClick={(e) => onWordClick(e, seg.text, seg.tr, dialogId, topicId)}
      >
        {seg.text}
      </span>
    ) : (
      <span key={i}>{seg.text}</span>
    )
  );
}

export default function ChatPanel({ dialogId, flashcards, onSaveWord, onRemoveWord }) {
  const d = DIALOGS[dialogId];
  const [shownLines, setShownLines] = useState(() => new Set());
  const [hoveredLine, setHoveredLine] = useState(null);
  const [popover, setPopover] = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    setShownLines(new Set());
    setPopover(null);
  }, [dialogId]);

  useEffect(() => {
    function handleDocClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPopover(null);
      }
    }
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  const savedWords = new Set(flashcards.map((f) => f.word));

  function toggleTranslation(li) {
    setShownLines((prev) => {
      const next = new Set(prev);
      if (next.has(li)) next.delete(li);
      else next.add(li);
      return next;
    });
  }

  function onWordClick(e, word, tr, dlgId, topicId) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const panelRect = panelRef.current.getBoundingClientRect();
    setPopover({
      word,
      tr,
      dialogId: dlgId,
      topicId,
      top: rect.bottom - panelRect.top + panelRef.current.scrollTop + 8,
      left: rect.left - panelRect.left,
    });
  }

  const alreadySaved = popover ? savedWords.has(popover.word) : false;

  return (
    <div className="chat-panel" ref={panelRef} style={{ position: 'relative' }}>
      <h3 className="dialog-heading">{d.title}</h3>
      <p className="dialog-sub">{d.sub}</p>

      {d.lines.map((line, li) => (
        <div className={`bubble-row ${line.side}`} key={li}>
          <div className="bubble-wrap">
            <div className="speaker-tag">{line.speaker}</div>
            <div
              className="bubble"
              onClick={() => toggleTranslation(li)}
              onMouseEnter={() => setHoveredLine(li)}
              onMouseLeave={() => setHoveredLine(null)}
            >
              <BubbleWords
                line={line}
                dialogId={dialogId}
                topicId={d.topicId}
                savedWords={savedWords}
                onWordClick={onWordClick}
              />
            </div>
            {line.translit && <div className="translit">{line.translit}</div>}
            <div className={`translation-line ${shownLines.has(li) || hoveredLine === li ? 'shown' : ''}`}>{line.tr}</div>
          </div>
        </div>
      ))}

      <div className="hint-row">Hover or tap a bubble to translate the sentence · tap a word to translate &amp; save it</div>

      {popover && (
        <div className="popover shown" style={{ top: popover.top, left: popover.left }}>
          <div className="tr">
            {popover.word} — {popover.tr}
          </div>
          <button
            className={alreadySaved ? 'saved-btn' : ''}
            onClick={() => {
              if (alreadySaved) onRemoveWord(popover.word);
              else onSaveWord(popover);
              setPopover(null);
            }}
          >
            {alreadySaved ? '✕ Remove flashcard' : '+ Save as flashcard'}
          </button>
        </div>
      )}
    </div>
  );
}
