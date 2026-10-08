'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import s from '@/styles/Auth.module.css';

function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(
    params.get('error') === 'confirm' ? 'That confirmation link is invalid or expired. Please log in or sign up again.' : null,
  );
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const { error: err } = await createClient().auth.signInWithPassword({
      email: String(form.get('email')).trim(),
      password: String(form.get('password')),
    });
    if (err) {
      setError(err.message);
      setBusy(false);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className={s.page}>
      {/* ── LEFT: form ──────────────────────────────────── */}
      <div className={s.formPanel}>
        <Link href="/" className={s.backLink}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to home
        </Link>

        {/* Brand */}
        <Link href="/" className={s.brand} style={{ textDecoration: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo.svg" alt="AU Youth Network logo" className={s.brandLogo} />
          <span className={s.brandName}>AU Youth<br/>Network</span>
        </Link>

        <h1 className={s.heading}>Welcome back</h1>
        <p className={s.subheading}>
          Log in to your AU Youth Network account.
        </p>

        <form className={s.form} onSubmit={handleSubmit}>
          <div className={s.field}>
            <label className={s.label} htmlFor="login-email">Email</label>
            <input
              id="login-email"
              name="email"
              className={s.input}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className={s.field}>
            <label className={s.label} htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              className={s.input}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className={s.formError} role="alert">{error}</p>}

          <button type="submit" className={`${s.submitBtn} ${s.submitBtnDark}`} disabled={busy}>
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className={s.switchText}>
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className={s.switchLink}>Join the Network</Link>
        </p>
      </div>

      {/* ── RIGHT: image panel ──────────────────────────── */}
      <div className={s.imagePanel}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/card-img-2.webp"
          alt=""
          className={s.imagePanelImg}
        />
      </div>
    </div>
  );
}

// useSearchParams needs a Suspense boundary for static prerendering.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginView />
    </Suspense>
  );
}
