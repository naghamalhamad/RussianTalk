let activeSequenceStop = null;

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

  function finish() {
    if (finished) return;
    finished = true;
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
    utterance.onend = () => {
      if (finished) return;
      index += 1;
      playNext();
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
