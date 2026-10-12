'use client';

import Link from 'next/link';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import gsap from 'gsap';
import { authErrorMessage } from '@/lib/authErrors';
import { useIso } from '@/lib/hooks';
import { createClient } from '@/lib/supabase/client';
import s from '@/styles/Auth.module.css';

const RESEND_SECONDS = 60;
const OTP_BOXES = 6;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type OtpPhase = 'idle' | 'verifying' | 'error' | 'success';

// Decorative row of 6 boxes under the real input (the input stays the only control; this row is aria-hidden).
// Typing: the digit pops into its box and the active box glows. Verifying: the boxes gather, spread into a ring
// and orbit. Wrong code: they settle back, shake and get a red outline. Right code: they merge into one box
// with a ring and a check, then onSuccessDone fires. Only transform and opacity are animated.
function OtpBoxes({ code, phase, focused, onSuccessDone }: {
  code: string;
  phase: OtpPhase;
  focused: boolean;
  onSuccessDone: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const boxRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const digitRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const okRef = useRef<HTMLSpanElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const checkRef = useRef<HTMLSpanElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);
  const orbitRef = useRef<gsap.core.Timeline | null>(null);
  const prevLen = useRef(code.length);
  const doneRef = useRef(onSuccessDone);
  doneRef.current = onSuccessDone;

  // one context for the whole component, reverted only on unmount (phase changes must not snap the boxes back)
  useIso(() => {
    const ctx = gsap.context(() => {}, stageRef);
    ctxRef.current = ctx;
    return () => { ctx.revert(); ctxRef.current = null; };
  }, []);

  // typing: new digits pop in; clearing the code (new code sent) lets the boxes rise back in
  useIso(() => {
    const prev = prevLen.current;
    prevLen.current = code.length;
    const ctx = ctxRef.current;
    if (!ctx || phase !== 'idle' || reducedMotion()) return;
    ctx.add(() => {
      if (code.length > prev) {
        const digits = digitRefs.current.slice(prev, Math.min(code.length, OTP_BOXES)).filter(Boolean);
        if (digits.length) gsap.fromTo(digits, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'power2.out', stagger: 0.04, clearProps: 'transform,opacity' });
      } else if (code.length === 0 && prev > 0) {
        gsap.fromTo(boxRefs.current.filter(Boolean), { y: 6, opacity: 0.4 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out', stagger: 0.03, clearProps: 'transform,opacity' });
      }
    });
  }, [code.length, phase]);

  // verifying / error / success
  useIso(() => {
    const ctx = ctxRef.current;
    const stage = stageRef.current;
    if (!ctx || !stage) return;
    if (reducedMotion()) {
      if (phase === 'success') doneRef.current();
      return;
    }
    if (phase === 'idle') return;
    const boxes = boxRefs.current.filter((b): b is HTMLSpanElement => !!b);
    // distance from each box to the middle of the stage (layout values, so they ignore current transforms)
    const dx = boxes.map((b) => stage.clientWidth / 2 - (b.offsetLeft + b.offsetWidth / 2));
    const dy = boxes.map((b) => stage.clientHeight / 2 - (b.offsetTop + b.offsetHeight / 2));
    const turns = () => boxes.map((b) => Math.round(Number(gsap.getProperty(b, 'rotation')) / 360) * 360);

    ctx.add(() => {
      orbitRef.current?.kill();
      orbitRef.current = null;

      if (phase === 'verifying') {
        const R = 28;
        const tilt = boxes.map((_, i) => (i % 2 ? 1 : -1) * (8 + i * 2));
        const p = { r: 0, a: 0 };
        const place = () => boxes.forEach((b, i) => {
          const t = ((i * 360) / boxes.length - 90 + p.a) * (Math.PI / 180);
          gsap.set(b, { x: dx[i] + Math.cos(t) * p.r, y: dy[i] + Math.sin(t) * p.r, rotation: p.a + tilt[i] });
        });
        orbitRef.current = gsap.timeline()
          .to(boxes, { x: (i: number) => dx[i], y: (i: number) => dy[i], scale: 0.55, rotation: (i: number) => tilt[i], duration: 0.3, ease: 'power2.inOut', stagger: { each: 0.04, from: 'center' } })
          .to(p, { r: R, duration: 0.25, ease: 'power3.out', onUpdate: place })
          .to(p, { a: 360, duration: 0.9, ease: 'power1.in', onUpdate: place })
          .to(p, { a: 720, duration: 1.4, ease: 'none', repeat: -1, onUpdate: place });
      } else if (phase === 'error') {
        const rot = turns();
        gsap.timeline()
          .to(boxes, { x: 0, y: 0, scale: 1, rotation: (i: number) => rot[i], duration: 0.35, ease: 'power3.out', stagger: { each: 0.02, from: 'center' }, overwrite: 'auto' })
          .set(boxes, { clearProps: 'transform' })
          .to(stage, { keyframes: { x: [-9, 8, -6, 5, -3, 0], easeEach: 'sine.inOut' }, duration: 0.45, clearProps: 'transform' }, '-=0.05');
      } else if (phase === 'success') {
        const rot = turns();
        gsap.timeline({ onComplete: () => doneRef.current() })
          .to(boxes, { x: (i: number) => dx[i], y: (i: number) => dy[i], rotation: (i: number) => rot[i], scale: 0.6, duration: 0.28, ease: 'power3.in', overwrite: 'auto' })
          .to(boxes, { opacity: 0, duration: 0.12, ease: 'none' }, '-=0.1')
          .fromTo(okRef.current, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }, '-=0.1')
          .fromTo(ringRef.current, { scale: 0.7, opacity: 0.9 }, { scale: 2.6, opacity: 0, duration: 0.55, ease: 'power2.out' }, '<')
          .fromTo(checkRef.current, { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)' }, '<0.08')
          .to({}, { duration: 0.25 });
      }
    });
  }, [phase]);

  const activeIdx = phase === 'idle' && focused && code.length < OTP_BOXES ? code.length : -1;
  return (
    <div className={s.otpStage} ref={stageRef} aria-hidden="true">
      {Array.from({ length: OTP_BOXES }, (_, i) => (
        <span
          key={i}
          ref={(el) => { boxRefs.current[i] = el; }}
          className={[
            s.otpBox,
            i === activeIdx ? s.otpBoxActive : '',
            i < code.length ? s.otpBoxFilled : '',
            phase === 'verifying' ? s.otpBoxBusy : '',
            phase === 'error' ? s.otpBoxError : '',
          ].join(' ')}
        >
          {i < code.length && <span ref={(el) => { digitRefs.current[i] = el; }}>{code[i]}</span>}
          {i === activeIdx && <span className={s.otpCaret} />}
        </span>
      ))}
      <span className={s.otpRing} ref={ringRef} />
      <span className={s.otpOk} ref={okRef} />
      <span className={s.otpCheck} ref={checkRef}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M5 11.5L9.5 16L17 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}

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
  const [phase, setPhase] = useState<OtpPhase>('idle');
  const [focused, setFocused] = useState(false);
  const noteRef = useRef<HTMLParagraphElement>(null);
  const pushed = useRef(false);
  // a code was just sent after sign-up, so wait before offering another one
  const [wait, setWait] = useState(emailParam && !unconfirmed ? RESEND_SECONDS : 0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  // a new note rises in softly
  useIso(() => {
    if (!note || reducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(noteRef.current, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out', clearProps: 'transform,opacity' });
    });
    return () => ctx.revert();
  }, [note]);

  // verified: go in once the success animation has played (also called by a fallback timer, so a failed animation never blocks)
  function goIn() {
    if (pushed.current) return;
    pushed.current = true;
    router.push('/dashboard');
    router.refresh();
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNote(null);
    setPhase('verifying');
    const { error: err } = await createClient().auth.verifyOtp({ email: email.trim(), token: code, type: 'signup' });
    if (err) {
      setError(authErrorMessage(err, 'verify'));
      setBusy(false);
      setPhase('error');
      return;
    }
    // verified: the session is already set, so go in after the success animation
    setPhase('success');
    setTimeout(goIn, 2500);
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
    setPhase('idle');
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
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); if (phase === 'error') setPhase('idle'); }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              required
            />
          </div>

          <OtpBoxes code={code} phase={phase} focused={focused} onSuccessDone={goIn} />

          {error && <p className={s.formError} role="alert">{error}</p>}
          {note && <p className={s.formNote} role="status" ref={noteRef}>{note}</p>}

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
