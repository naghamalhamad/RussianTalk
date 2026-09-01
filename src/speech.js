let activeSequenceStop = null;

// Slower than the browser's default (1) so words are easier to catch while
// learning; and a short silent gap between sentences in a full-dialog
// playback, so one sentence doesn't run straight into the next.
const SPEECH_RATE = 0.8;
const PAUSE_BETWEEN_SENTENCES_MS = 700;

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function stopActiveSequence() {
  if (activeSequenceStop) {
    const stop = activeSequenceStop;
    activeSequenceStop = null;
    stop();
  }
}

export function speak(text, lang = 'ru-RU') {
  if (!isSpeechSupported()) return;
  stopActiveSequence();
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = SPEECH_RATE;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  stopActiveSequence();
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}

// Reads a list of texts one after another, moving to the next only once the
// previous one finishes. Returns a stop() function the caller can use to
// cancel it early. onStepStart(index) fires right before each item starts;
// onDone() fires exactly once, whether playback finished naturally, was
// stopped explicitly, or was interrupted by another speak()/speakSequence()
// call elsewhere in the app.
export function speakSequence(texts, { lang = 'ru-RU', onStepStart, onDone } = {}) {
  if (!isSpeechSupported() || !texts.length) {
    onDone?.();
    return () => {};
  }
  stopActiveSequence();
  window.speechSynthesis.cancel();

  let finished = false;
  let index = 0;
  let pauseTimer = null;

  function finish() {
    if (finished) return;
    finished = true;
    if (pauseTimer) clearTimeout(pauseTimer);
    if (activeSequenceStop === stop) activeSequenceStop = null;
    onDone?.();
  }

  function playNext() {
    if (finished) return;
    if (index >= texts.length) {
      finish();
      return;
    }
    const i = index;
    onStepStart?.(i);
    const utterance = new SpeechSynthesisUtterance(texts[i]);
    utterance.lang = lang;
    utterance.rate = SPEECH_RATE;
    utterance.onend = () => {
      if (finished) return;
      index += 1;
      // A brief silent gap before the next sentence, instead of running
      // straight into it, so each one reads as a separate beat.
      pauseTimer = setTimeout(() => {
        pauseTimer = null;
        playNext();
      }, PAUSE_BETWEEN_SENTENCES_MS);
    };
    utterance.onerror = () => finish();
    window.speechSynthesis.speak(utterance);
  }

  function stop() {
    if (finished) return;
    finish();
    window.speechSynthesis.cancel();
  }

  activeSequenceStop = stop;
  playNext();
  return stop;
}
