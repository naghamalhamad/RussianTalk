let activeSequenceStop = null;

// Slower than the browser's default (1) so words are easier to catch while
// learning; and a short silent gap between sentences in a full-dialog
// playback, so one sentence doesn't run straight into the next.
const SPEECH_RATE = 0.8;
const PAUSE_BETWEEN_SENTENCES_MS = 700;

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

let cachedVoices = null;

function loadVoices() {
  if (!isSpeechSupported()) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) cachedVoices = voices;
  return cachedVoices || voices;
}

if (isSpeechSupported()) {
  // Voices often aren't ready on the very first call - the browser loads
  // them asynchronously and fires this once they're available.
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    cachedVoices = window.speechSynthesis.getVoices();
  });
}

// The Web Speech API doesn't expose a voice's gender, so picking a "male"
// voice is a best-effort name match against whatever voices the visitor's
// own device happens to have installed - the same "depends on the device,
// not the app" limitation as Russian voice support itself (see
// ARCHITECTURE.md, "How Audio Playback Works").
const MALE_VOICE_NAME_HINTS = [
  'male', 'yuri', 'yury', 'pavel', 'dmitri', 'dmitry', 'ivan', 'sergei', 'sergey',
  'boris', 'nikolai', 'mikhail', 'aleksei', 'alexei', 'maxim',
];

function findMaleVoice(lang) {
  const langPrefix = lang.slice(0, 2).toLowerCase();
  const voices = loadVoices().filter((v) => v.lang?.toLowerCase().startsWith(langPrefix));
  return voices.find((v) => MALE_VOICE_NAME_HINTS.some((hint) => v.name.toLowerCase().includes(hint)));
}

// 'left' is always the other person in a dialogue (waiter, cashier, staff,
// friend...); 'right' is always "You," the learner's own line. Only the
// 'left' role gets a specifically-picked voice, so the two roles sound
// different wherever the visitor's device has a male Russian voice
// installed. 'right', and anything with no side at all (a single saved
// flashcard, a popover word with no line context), keeps whatever voice
// the browser already uses by default - unchanged from before.
function pickVoice(lang, side) {
  if (side !== 'left') return undefined;
  return findMaleVoice(lang);
}

function stopActiveSequence() {
  if (activeSequenceStop) {
    const stop = activeSequenceStop;
    activeSequenceStop = null;
    stop();
  }
}

export function speak(text, { lang = 'ru-RU', side } = {}) {
  if (!isSpeechSupported()) return;
  stopActiveSequence();
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = SPEECH_RATE;
  const voice = pickVoice(lang, side);
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  stopActiveSequence();
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}

// Reads a list of { text, side } items one after another, moving to the
// next only once the previous one finishes - side (see pickVoice above)
// picks the right-sounding voice for each line, the same way speak() does.
// Returns a stop() function the caller can use to cancel it early.
// onStepStart(index) fires right before each item starts; onDone() fires
// exactly once, whether playback finished naturally, was stopped
// explicitly, or was interrupted by another speak()/speakSequence() call
// elsewhere in the app.
export function speakSequence(items, { lang = 'ru-RU', onStepStart, onDone } = {}) {
  if (!isSpeechSupported() || !items.length) {
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
    if (index >= items.length) {
      finish();
      return;
    }
    const i = index;
    onStepStart?.(i);
    const item = items[i];
    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.lang = lang;
    utterance.rate = SPEECH_RATE;
    const voice = pickVoice(lang, item.side);
    if (voice) utterance.voice = voice;
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
