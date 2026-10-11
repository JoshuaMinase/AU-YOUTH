'use client';

import Link from 'next/link';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authErrorMessage } from '@/lib/authErrors';
import { createClient } from '@/lib/supabase/client';
import s from '@/styles/Auth.module.css';

function ResetView() {
  const router = useRouter();
  // Set when the reset email links straight to this page (?token_hash=...): that works on ANY device or browser, and an email
  // scanner that opens the link cannot use it up, because it is only checked when the new password is saved.
  const tokenHash = useSearchParams().get('token_hash');
  const verified = useRef(false);
  // null = still checking for the recovery session that /auth/callback created
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (tokenHash) { setHasSession(true); return; }
    createClient().auth.getUser().then(({ data }) => setHasSession(!!data.user));
  }, [tokenHash]);

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
    const supabase = createClient();
    if (tokenHash && !verified.current) {
      const { error: vErr } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash });
      if (vErr) {
        setError('This reset link is invalid or has expired. Request a new one and use the newest email.');
        setBusy(false);
        return;
      }
      verified.current = true;   // the link is used up; a retry (say, a too-weak password) must not check it again
    }
    const { error: err } = await supabase.auth.updateUser({ password });
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetView />
    </Suspense>
  );
}
