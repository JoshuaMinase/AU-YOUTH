'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import s from '@/styles/Auth.module.css';

export default function SignUpPage() {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: replace with real auth call
    router.push('/dashboard');
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
              className={s.input}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className={s.field}>
            <label className={s.label} htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              className={s.input}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>

          <button type="submit" className={`${s.submitBtn} ${s.submitBtnGold}`}>
            Create my account
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
