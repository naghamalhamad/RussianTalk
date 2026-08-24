import { useState } from 'react';
import { signIn, signOut, signUp } from '../auth.js';

export default function AccountView({ session, onBack }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null); // { type: 'error' | 'info', text }
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
            Signed in as <strong>{session.user.email}</strong>
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
    if (mode === 'signup') {
      const { error } = await signUp(email, password);
      setLoading(false);
      if (error) setStatus({ type: 'error', text: error.message });
      else setStatus({ type: 'info', text: 'Check your email for a confirmation link, then log in below.' });
    } else {
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) setStatus({ type: 'error', text: error.message });
      // On success the app-wide session updates automatically and this
      // screen will switch to the "signed in" view above.
    }
  }

  return (
    <section>
      <div className="back-row">
        <button className="back-btn" onClick={onBack}>← Topics</button>
      </div>
      <h2 className="topic-title">{mode === 'signup' ? 'Create an account' : 'Log in'}</h2>
      <p className="dialog-sub">
        {mode === 'signup'
          ? 'Save flashcards to your account so they follow you across devices.'
          : 'Log in to see your saved flashcards.'}
      </p>

      <form className="account-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
        </label>

        {status && <div className={`account-status ${status.type}`}>{status.text}</div>}

        <button className="account-btn" type="submit" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'signup' ? 'Sign up' : 'Log in'}
        </button>
      </form>

      <button
        className="account-switch"
        onClick={() => {
          setMode(mode === 'signup' ? 'signin' : 'signup');
          setStatus(null);
        }}
      >
        {mode === 'signup' ? 'Already have an account? Log in' : 'New here? Create an account'}
      </button>
    </section>
  );
}
