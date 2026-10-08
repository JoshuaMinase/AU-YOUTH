'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAllowedEmail } from '@/lib/data';
import { DOMAIN_MSG, authErrorMessage } from '@/lib/authErrors';
import { createClient } from '@/lib/supabase/client';
import s from '@/styles/Auth.module.css';

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email')).trim();
    if (!isAllowedEmail(email)) {
      setError(DOMAIN_MSG);
      return;
    }
    setBusy(true);
    setError(null);
    const { data, error: err } = await createClient().auth.signUp({
      email,
      password: String(form.get('password')),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          first_name: String(form.get('firstName')).trim(),
          last_name: String(form.get('lastName')).trim(),
        },
      },
    });
    setBusy(false);
    if (err) {
      setError(authErrorMessage(err, 'signup'));
      return;
    }
    if (data.session) {
      // Email confirmation is off: already signed in.
      router.push('/dashboard');
      router.refresh();
    } else {
      setSentTo(email);
    }
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

        <h1 className={s.heading}>Join the Network</h1>
        <p className={s.subheading}>
          Connect with young African professionals, interns, and fellows.
        </p>

        <form className={s.form} onSubmit={handleSubmit}>
          <div className={s.row}>
            <div className={s.field}>
              <label className={s.label} htmlFor="signup-firstname">First name</label>
              <input
                id="signup-firstname"
                name="firstName"
                className={s.input}
                type="text"
                placeholder="Amara"
                autoComplete="given-name"
                required
              />
            </div>
            <div className={s.field}>
              <label className={s.label} htmlFor="signup-lastname">Last name</label>
              <input
                id="signup-lastname"
                name="lastName"
                className={s.input}
                type="text"
                placeholder="Diallo"
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div className={s.field}>
            <label className={s.label} htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              name="email"
              className={s.input}
              type="email"
              placeholder="you@africanunion.org"
              autoComplete="email"
              required
            />
          </div>

          <div className={s.field}>
            <label className={s.label} htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              name="password"
              className={s.input}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
                minLength={8}
              required
            />
          </div>

          {error && <p className={s.formError} role="alert">{error}</p>}
          {sentTo && (
            <p className={s.formNote} role="status">
              Check your inbox: we sent a confirmation link to {sentTo}. Click it to finish creating your account.
            </p>
          )}

          <button type="submit" className={`${s.submitBtn} ${s.submitBtnGold}`} disabled={busy || !!sentTo}>
            {busy ? 'Creating account…' : 'Create my account'}
          </button>
        </form>

        <p className={s.switchText}>
          Already a member?{' '}
          <Link href="/login" className={s.switchLink}>Log in</Link>
        </p>
      </div>

      {/* ── RIGHT: image panel ──────────────────────────── */}
      <div className={s.imagePanel}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/card-img-1.webp"
          alt=""
          className={s.imagePanelImg}
        />
      </div>
    </div>
  );
}
