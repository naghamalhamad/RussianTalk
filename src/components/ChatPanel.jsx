import { useEffect, useRef, useState } from 'react';
import { DIALOGS } from '../data.js';
import { isSpeechSupported, speakSequence, stopSpeaking } from '../speech.js';
import SpeakerButton from './SpeakerButton.jsx';

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
        onMouseEnter={(e) => onWordClick(e, seg.text, seg.tr, dialogId, topicId)}
      >
        {seg.text}
      </span>
    ) : (
      <span key={i}>{seg.text}</span>
    )
  );
}

export default function ChatPanel({ dialogId, flashcards, loggedIn, onSaveWord, onRemoveWord, onRequireLogin }) {
  const d = DIALOGS[dialogId];
  const [shownLines, setShownLines] = useState(() => new Set());
  const [hoveredLine, setHoveredLine] = useState(null);
  const [popover, setPopover] = useState(null);
  const [playingAll, setPlayingAll] = useState(false);
  const [activeLine, setActiveLine] = useState(null);
  const panelRef = useRef(null);
  const closeTimerRef = useRef(null);
  const stopSequenceRef = useRef(null);

  function cancelPopoverClose() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function schedulePopoverClose() {
    cancelPopoverClose();
    closeTimerRef.current = setTimeout(() => setPopover(null), 150);
  }

  useEffect(() => {
    setShownLines(new Set());
    setPopover(null);
    setPlayingAll(false);
    setActiveLine(null);
    stopSequenceRef.current = null;
    cancelPopoverClose();
    stopSpeaking();
  }, [dialogId]);

  useEffect(() => {
    return () => {
      cancelPopoverClose();
      stopSpeaking();
    };
  }, []);

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
    cancelPopoverClose();
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

  function toggleDialogPlayback() {
    if (playingAll) {
      stopSequenceRef.current?.();
      stopSequenceRef.current = null;
      setPlayingAll(false);
      setActiveLine(null);
      return;
    }
    setPopover(null);
    setPlayingAll(true);
    stopSequenceRef.current = speakSequence(
      d.lines.map((line) => line.ru),
      {
        onStepStart: (i) => setActiveLine(i),
        onDone: () => {
          stopSequenceRef.current = null;
          setPlayingAll(false);
          setActiveLine(null);
        },
      }
    );
  }

  const alreadySaved = popover ? savedWords.has(popover.word) : false;

  return (
    <div className="chat-panel" ref={panelRef} style={{ position: 'relative' }}>
      <div className="dialog-header">
        <div>
          <h3 className="dialog-heading">{d.title}</h3>
          <p className="dialog-sub">{d.sub}</p>
        </div>
        {isSpeechSupported() && (
          <button className={`play-all-btn ${playingAll ? 'playing' : ''}`} onClick={toggleDialogPlayback}>
            {playingAll ? '⏸ Stop' : '🔊 Listen to full dialog'}
          </button>
        )}
      </div>

      {d.lines.map((line, li) => (
        <div className={`bubble-row ${line.side} ${activeLine === li ? 'reading' : ''}`} key={li}>
          <div className="bubble-wrap">
            <div className="speaker-tag">
              {line.speaker}
              <SpeakerButton text={line.ru} label="Play sentence" />
            </div>
            <div
              className="bubble"
              onClick={() => toggleTranslation(li)}
              onMouseEnter={() => {
                setHoveredLine(li);
                cancelPopoverClose();
              }}
              onMouseLeave={() => {
                setHoveredLine(null);
                schedulePopoverClose();
              }}
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

      <div className="hint-row">Hover or tap a bubble to translate the sentence · hover or tap a word to hear, translate &amp; save it</div>

      {popover && (
        <div
          className="popover shown"
          style={{ top: popover.top, left: popover.left }}
          onMouseEnter={cancelPopoverClose}
          onMouseLeave={schedulePopoverClose}
        >
          <div className="tr">
            {popover.word} — {popover.tr}
            <SpeakerButton text={popover.word} label={`Play "${popover.word}"`} />
          </div>
          <button
            className={alreadySaved ? 'saved-btn' : ''}
            onClick={() => {
              if (!loggedIn) {
                onRequireLogin();
              } else if (alreadySaved) {
                onRemoveWord(popover.word);
              } else {
                onSaveWord(popover);
              }
              setPopover(null);
            }}
          >
            {!loggedIn ? 'Log in to save' : alreadySaved ? '✕ Remove flashcard' : '+ Save as flashcard'}
          </button>
        </div>
      )}
    </div>
  );
}
