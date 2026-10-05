import s from '@/styles/Auth.module.css';

export default function SignUpPage() {
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

        <h1 className={s.heading}>Join the Network</h1>
        <p className={s.subheading}>
          Connect with young African professionals, interns, and fellows.
        </p>

        <form className={s.form}>
          <div className={s.row}>
            <div className={s.field}>
              <label className={s.label} htmlFor="signup-firstname">First name</label>
              <input
                id="signup-firstname"
                className={s.input}
                type="text"
                placeholder="Amara"
                autoComplete="given-name"
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
            />
          </div>

          <button type="submit" className={`${s.submitBtn} ${s.submitBtnGold}`}>
            Create my account
          </button>
        </form>

        <p className={s.switchText}>
          Already a member?{' '}
          <a href="/login" className={s.switchLink}>Log in</a>
        </p>
      </div>

      {/* ── RIGHT: image panel ──────────────────────────── */}
      <div className={s.imagePanel}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/card-img-1.jpg"
          alt=""
          className={s.imagePanelImg}
        />
      </div>
    </div>
  );
}
