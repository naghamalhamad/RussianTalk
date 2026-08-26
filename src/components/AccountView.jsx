import { useState } from 'react';
import { emailToId, signInWithId, signOut } from '../auth.js';

export default function AccountView({ session, onBack }) {
  const [id, setId] = useState('');
  const [status, setStatus] = useState(null); // { type: 'error', text }
  const [loading, setLoading] = useState(false);

  if (session) {
    return (
      <section>
        <div className="back-row">
          <button className="back-btn" onClick={onBack}>← Topics</button>
        </div>
        <h2 className="topic-title">Your account</h2>
        <div className="account-card">
          <p>
            Signed in as <strong>{emailToId(session.user.email)}</strong>
          </p>
          <button className="account-btn" onClick={() => signOut()}>
            Log out
          </button>
        </div>
      </section>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    const { error } = await signInWithId(id);
    setLoading(false);
    if (error) setStatus({ type: 'error', text: error.message });
    // On success the app-wide session updates automatically and this
    // screen will switch to the "signed in" view above.
  }

  return (
    <section>
      <div className="back-row">
        <button className="back-btn" onClick={onBack}>← Topics</button>
      </div>
      <h2 className="topic-title">Log in</h2>
      <p className="dialog-sub">
        Type an ID to see your saved flashcards. First time using it? It's yours from now on — use the
        same one next time to get your flashcards back.
      </p>

      <form className="account-form" onSubmit={handleSubmit}>
        <label>
          Your ID
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
            autoComplete="username"
            placeholder="e.g. nagham"
          />
        </label>

        {status && <div className={`account-status ${status.type}`}>{status.text}</div>}

        <button className="account-btn" type="submit" disabled={loading}>
          {loading ? 'Please wait…' : 'Continue'}
        </button>
      </form>
    </section>
  );
}
