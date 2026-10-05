import s from '@/styles/Auth.module.css';

export default function LoginPage() {
  return (
    <div className={s.page}>
      {/* ── LEFT: form ──────────────────────────────────── */}
      <div className={s.formPanel}>
        <a href="/" className={s.backLink}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to home
        </a>

        {/* Brand */}
        <div className={s.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo.svg" alt="AU Youth Network logo" className={s.brandLogo} />
          <span className={s.brandName}>AU Youth<br/>Network</span>
        </div>

        <h1 className={s.heading}>Welcome back</h1>
        <p className={s.subheading}>
          Log in to your AU Youth Network account.
        </p>

        <form className={s.form}>
          <div className={s.field}>
            <label className={s.label} htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className={s.input}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className={s.field}>
            <label className={s.label} htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className={s.input}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className={`${s.submitBtn} ${s.submitBtnDark}`}>
            Log in
          </button>
        </form>

        <p className={s.switchText}>
          Don&apos;t have an account?{' '}
          <a href="/sign-up" className={s.switchLink}>Join the Network</a>
        </p>
      </div>

      {/* ── RIGHT: image panel ──────────────────────────── */}
      <div className={s.imagePanel}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/card-img-2.jpg"
          alt=""
          className={s.imagePanelImg}
        />
      </div>
    </div>
  );
}
