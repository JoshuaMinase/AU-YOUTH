'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authErrorMessage } from '@/lib/authErrors';
import { createClient } from '@/lib/supabase/client';
import s from '@/styles/Auth.module.css';

const RESEND_SECONDS = 60;

// Opened right after sign-up (and from login when the email is not confirmed yet):
// the member types the code from the email, Supabase confirms the account and signs them in.
// Needs the "Confirm signup" email template to contain {{ .Token }} (see AGENTS.md).
function VerifyView() {
  const router = useRouter();
  const params = useSearchParams();
  const emailParam = (params.get('email') ?? '').trim();
  const unconfirmed = params.get('notice') === 'unconfirmed';

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(
    unconfirmed ? 'Your email isn’t confirmed yet. Enter the code we emailed you, or send a new one.' : null,
  );
  const [busy, setBusy] = useState(false);
  // a code was just sent after sign-up, so wait before offering another one
  const [wait, setWait] = useState(emailParam && !unconfirmed ? RESEND_SECONDS : 0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNote(null);
    const { error: err } = await createClient().auth.verifyOtp({ email: email.trim(), token: code, type: 'signup' });
    if (err) {
      setError(authErrorMessage(err, 'verify'));
      setBusy(false);
      return;
    }
    // verified: the session is already set, so go straight in
    router.push('/dashboard');
    router.refresh();
  }

  async function handleResend() {
    if (!email.trim()) { setError('Enter your email address first.'); return; }
    setBusy(true);
    setError(null);
    setNote(null);
    const { error: err } = await createClient().auth.resend({ type: 'signup', email: email.trim() });
    setBusy(false);
    if (err) { setError(authErrorMessage(err, 'signup')); return; }
    setNote(`We sent a new code to ${email.trim()}. Only the newest code works.`);
    setCode('');
    setWait(RESEND_SECONDS);
  }

  return (
    <div className={s.page}>
      {/* ── LEFT: form ──────────────────────────────────── */}
      <div className={s.formPanel}>
        <Link href="/sign-up" className={s.backLink}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to sign up
        </Link>

        {/* Brand */}
        <Link href="/" className={s.brand} style={{ textDecoration: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo.svg" alt="AU Youth Network logo" className={s.brandLogo} />
          <span className={s.brandName}>AU Youth<br/>Network</span>
        </Link>

        <h1 className={s.heading}>Check your email</h1>
        <p className={s.subheading}>
          {emailParam
            ? <>We sent a code to <strong>{emailParam}</strong>. Enter it below to finish creating your account.</>
            : 'Enter your email address and the code we sent you to finish creating your account.'}
        </p>

        <form className={s.form} onSubmit={handleVerify}>
          {!emailParam && (
            <div className={s.field}>
              <label className={s.label} htmlFor="verify-email">Email</label>
              <input
                id="verify-email"
                className={s.input}
                type="email"
                placeholder="you@africanunion.org"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          <div className={s.field}>
            <label className={s.label} htmlFor="verify-code">Code from the email</label>
            <input
              id="verify-code"
              className={`${s.input} ${s.otp}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6,10}"
              title="Enter the numeric code from the email"
              placeholder="······"
              autoComplete="one-time-code"
              maxLength={10}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>

          {error && <p className={s.formError} role="alert">{error}</p>}
          {note && <p className={s.formNote} role="status">{note}</p>}

          <button type="submit" className={`${s.submitBtn} ${s.submitBtnGold}`} disabled={busy || code.length < 6}>
            {busy ? 'Checking…' : 'Confirm and continue'}
          </button>
        </form>

        <p className={s.switchText}>
          Didn’t get it? Check your spam folder, or{' '}
          <button type="button" className={s.resendBtn} onClick={handleResend} disabled={busy || wait > 0}>
            {wait > 0 ? `send a new code in ${wait}s` : 'send a new code'}
          </button>
        </p>
        <p className={s.switchText}>
          Already confirmed?{' '}
          <Link href="/login" className={s.switchLink}>Log in</Link>
        </p>
      </div>

      {/* ── RIGHT: image panel ──────────────────────────── */}
      <div className={s.imagePanel}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/card-img-3.webp"
          alt=""
          className={s.imagePanelImg}
        />
      </div>
    </div>
  );
}

// useSearchParams needs a Suspense boundary for static prerendering.
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyView />
    </Suspense>
  );
}
