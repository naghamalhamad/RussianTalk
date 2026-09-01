import { speak, isSpeechSupported } from '../speech.js';

export default function SpeakerButton({ text, label, className = '', side }) {
  if (!isSpeechSupported()) return null;
  return (
    <button
      type="button"
      className={`speaker-btn ${className}`}
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        speak(text, { side });
      }}
    >
      🔊
    </button>
  );
}
