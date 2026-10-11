'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authErrorMessage } from '@/lib/authErrors';
import { createClient } from '@/lib/supabase/client';
import s from '@/styles/Auth.module.css';

export default function ResetPasswordPage() {
  const router = useRouter();
  // null = still checking for the recovery session that /auth/callback created
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setHasSession(!!data.user));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get('password'));
    if (password !== String(form.get('confirm'))) {
      setError('The two passwords don’t match. Type the same password in both boxes.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await createClient().auth.updateUser({ password });
    if (err) {
      setError(authErrorMessage(err, 'reset'));
      setBusy(false);
      return;
    }
    setDone(true);
    // The recovery link already signed the member in, so go straight to the portal.
    setTimeout(() => {
      router.push('/dashboard');
      router.refresh();
    }, 1500);
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

        <h1 className={s.heading}>Choose a new password</h1>

        {hasSession === false ? (
          <>
            <p className={s.formError} role="alert">
              This page only works from the link in your reset email, and that link is missing or has expired.
            </p>
            <p className={s.switchText}>
              <Link href="/forgot-password" className={s.switchLink}>Get a new reset link</Link>
            </p>
          </>
        ) : (
          <>
            <p className={s.subheading}>Use at least 8 characters with a mix of letters and numbers.</p>

            <form className={s.form} onSubmit={handleSubmit}>
              <div className={s.field}>
                <label className={s.label} htmlFor="reset-password">New password</label>
                <input
                  id="reset-password"
                  name="password"
                  className={s.input}
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={hasSession === null || done}
                />
              </div>

              <div className={s.field}>
                <label className={s.label} htmlFor="reset-confirm">Confirm new password</label>
                <input
                  id="reset-confirm"
                  name="confirm"
                  className={s.input}
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={hasSession === null || done}
                />
              </div>

              {error && <p className={s.formError} role="alert">{error}</p>}
              {done && (
                <p className={s.formNote} role="status">
                  Password updated. Taking you to your dashboard…
                </p>
              )}

              <button
                type="submit"
                className={`${s.submitBtn} ${s.submitBtnDark}`}
                disabled={busy || done || hasSession === null}
              >
                {busy ? 'Saving…' : 'Save new password'}
              </button>
            </form>
          </>
        )}
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
