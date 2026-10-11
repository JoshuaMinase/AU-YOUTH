'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { authErrorMessage } from '@/lib/authErrors';
import { createClient } from '@/lib/supabase/client';
import s from '@/styles/Auth.module.css';

function ForgotView() {
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(
    params.get('error') === 'link' ? 'That reset link is invalid or has expired. Enter your email to get a new one.' : null,
  );
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email')).trim();
    setBusy(true);
    setError(null);
    const { error: err } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setBusy(false);
    if (err) {
      setError(authErrorMessage(err, 'reset'));
      return;
    }
    // Same message whether or not the email has an account, so nobody can probe which emails are registered.
    setSentTo(email);
  }

  return (
    <div className={s.page}>
      {/* ── LEFT: form ──────────────────────────────────── */}
      <div className={s.formPanel}>
        <Link href="/login" className={s.backLink}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to log in
        </Link>

        {/* Brand */}
        <Link href="/" className={s.brand} style={{ textDecoration: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo.svg" alt="AU Youth Network logo" className={s.brandLogo} />
          <span className={s.brandName}>AU Youth<br/>Network</span>
        </Link>

        <h1 className={s.heading}>Forgot your password?</h1>
        <p className={s.subheading}>
          Enter your account email and we&apos;ll send you a link to choose a new password.
        </p>

        <form className={s.form} onSubmit={handleSubmit}>
          <div className={s.field}>
            <label className={s.label} htmlFor="forgot-email">Email</label>
            <input
              id="forgot-email"
              name="email"
              className={s.input}
              type="email"
              placeholder="you@africanunion.org"
              autoComplete="email"
              required
            />
          </div>

          {error && <p className={s.formError} role="alert">{error}</p>}
          {sentTo && (
            <p className={s.formNote} role="status">
              If an account exists for {sentTo}, a reset link is on its way. Check your inbox (and spam). The link works once and expires after a short time.
            </p>
          )}

          <button type="submit" className={`${s.submitBtn} ${s.submitBtnDark}`} disabled={busy}>
            {busy ? 'Sending…' : sentTo ? 'Send again' : 'Send reset link'}
          </button>
        </form>

        <p className={s.switchText}>
          Remembered it?{' '}
          <Link href="/login" className={s.switchLink}>Log in</Link>
        </p>
      </div>

      {/* ── RIGHT: image panel ──────────────────────────── */}
      <div className={s.imagePanel}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/card-img-2.webp"
          alt=""
          aria-hidden="true"
          className={s.imagePanelImg}
        />
      </div>
    </div>
  );
}

// useSearchParams needs a Suspense boundary for static prerendering.
export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotView />
    </Suspense>
  );
}
