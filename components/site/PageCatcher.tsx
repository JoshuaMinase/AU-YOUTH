'use client';
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { getLenis } from '../SmoothScroll';
import s from '../../styles/Site.module.css';

/* Lost page catcher: the 404 mini game. The 404 hero shows a "Want to play a game?" button; it opens the game full screen.
 * Pages fall, slide the basket to catch them, three misses and the game is over.
 * The game rules run on a 400x500 field; the canvas is drawn at the size it is shown (4:5), so it stays sharp when large.
 * Nothing is saved anywhere (the best score lives only until the page closes). */

const W = 400, H = 500;
const BASKET_W = 88, BASKET_H = 36, BASKET_Y = H - 24 - BASKET_H;
const PAGE_W = 40, PAGE_H = 50;
const KEY_SPEED = 460; // px per second the basket moves with the keyboard
const MAX_LIVES = 3;
const TAGS = ['#218380', '#8F2D56', '#FBB13C', '#0072C6']; // the four AU card colours

type Phase = 'ready' | 'playing' | 'over';
type Falling = { x: number; y: number; v: number; rot: number; spin: number; tag: string; crossed: boolean };
type Game = { bx: number; pages: Falling[]; spawn: number; score: number; lives: number; pulse: number };

const fresh = (): Game => ({ bx: W / 2, pages: [], spawn: 0.6, score: 0, lives: MAX_LIVES, pulse: 0 });
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPage(ctx: CanvasRenderingContext2D, p: Falling) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  roundRect(ctx, -PAGE_W / 2, -PAGE_H / 2, PAGE_W, PAGE_H, 5);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = 'rgba(3,34,16,.18)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = p.tag;
  roundRect(ctx, -PAGE_W / 2 + 6, -PAGE_H / 2 + 7, PAGE_W - 12, 7, 3);
  ctx.fill();
  ctx.fillStyle = '#D9D7D0';
  ctx.fillRect(-PAGE_W / 2 + 6, -PAGE_H / 2 + 21, PAGE_W - 12, 3);
  ctx.fillRect(-PAGE_W / 2 + 6, -PAGE_H / 2 + 29, PAGE_W - 12, 3);
  ctx.fillRect(-PAGE_W / 2 + 6, -PAGE_H / 2 + 37, (PAGE_W - 12) * 0.6, 3);
  ctx.restore();
}

function drawBasket(ctx: CanvasRenderingContext2D, x: number, pulse: number) {
  ctx.save();
  ctx.translate(x, BASKET_Y + BASKET_H); // origin = bottom centre of the basket
  ctx.scale(1 + pulse * 0.08, 1 - pulse * 0.06);
  ctx.beginPath();
  ctx.moveTo(-BASKET_W / 2, -BASKET_H);
  ctx.lineTo(BASKET_W / 2, -BASKET_H);
  ctx.lineTo(BASKET_W / 2 - 10, 0);
  ctx.lineTo(-BASKET_W / 2 + 10, 0);
  ctx.closePath();
  ctx.fillStyle = '#FBB13C';
  ctx.fill();
  ctx.strokeStyle = 'rgba(3,34,16,.28)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const k of [-0.5, 0, 0.5]) { ctx.moveTo(k * (BASKET_W - 20), -BASKET_H + 8); ctx.lineTo(k * (BASKET_W - 20), -4); }
  ctx.moveTo(-BASKET_W / 2 + 4, -BASKET_H / 2); ctx.lineTo(BASKET_W / 2 - 4, -BASKET_H / 2);
  ctx.stroke();
  roundRect(ctx, -BASKET_W / 2 - 5, -BASKET_H - 6, BASKET_W + 10, 11, 5);
  ctx.fillStyle = '#FCD116';
  ctx.fill();
  ctx.restore();
}

export default function PageCatcher() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('ready');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [best, setBest] = useState(0);
  const launchRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playRef = useRef<HTMLButtonElement>(null);
  const againRef = useRef<HTMLButtonElement>(null);
  const game = useRef<Game>(fresh());

  const openGame = () => {
    game.current = fresh();
    setScore(0);
    setLives(MAX_LIVES);
    setPhase('ready');
    setOpen(true);
  };
  const closeGame = () => {
    setOpen(false);
    setPhase('ready');
    launchRef.current?.focus();
  };
  const start = () => {
    game.current = fresh();
    setScore(0);
    setLives(MAX_LIVES);
    setPhase('playing');
    dialogRef.current?.focus(); // keeps the focus inside the dialog after the Play button disappears
  };

  /* while the game is open: page behind it does not scroll, Escape closes, focus starts on Play */
  useEffect(() => {
    if (!open) return;
    getLenis()?.stop();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); setPhase('ready'); launchRef.current?.focus(); } };
    window.addEventListener('keydown', onEsc);
    playRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onEsc);
      document.body.style.overflow = prev;
      getLenis()?.start();
    };
  }, [open]);

  /* Tab stays inside the dialog */
  const trap = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const els = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button, a[href]'));
    if (!els.length) return;
    const first = els[0], lastEl = els[els.length - 1];
    const inside = e.currentTarget.contains(document.activeElement) && document.activeElement !== e.currentTarget;
    if (e.shiftKey && (!inside || document.activeElement === first)) { e.preventDefault(); lastEl.focus(); }
    else if (!e.shiftKey && (!inside || document.activeElement === lastEl)) { e.preventDefault(); first.focus(); }
  };

  /* the game loop runs only while playing */
  useEffect(() => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const slow = reduce ? 0.7 : 1; // reduced motion: slower pages, no spin or basket pulse
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    /* draw at the size the canvas is shown, so it stays sharp when large */
    const fit = () => {
      const w = canvas.clientWidth || W;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round((w * H / W) * dpr);
      const k = (w / W) * dpr;
      ctx.setTransform(k, 0, 0, k, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    const g = game.current;
    const held = { left: false, right: false };
    const keyDir = (e: KeyboardEvent): 'left' | 'right' | null => {
      if (e.ctrlKey || e.metaKey || e.altKey) return null;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') return 'left';
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') return 'right';
      return null;
    };
    const onDown = (e: KeyboardEvent) => { const d = keyDir(e); if (d) { held[d] = true; e.preventDefault(); } };
    const onUp = (e: KeyboardEvent) => { const d = keyDir(e); if (d) held[d] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const dir = (held.right ? 1 : 0) - (held.left ? 1 : 0);
      if (dir) g.bx = clamp(g.bx + dir * KEY_SPEED * dt, BASKET_W / 2, W - BASKET_W / 2);

      /* new page: faster and more often as the score grows */
      g.spawn -= dt;
      if (g.spawn <= 0) {
        g.pages.push({
          x: PAGE_W + Math.random() * (W - PAGE_W * 2), y: -PAGE_H,
          v: (140 + Math.min(g.score, 60) * 5 + Math.random() * 50) * slow,
          rot: (Math.random() - 0.5) * 0.6, spin: reduce ? 0 : (Math.random() - 0.5) * 1.4,
          tag: TAGS[Math.floor(Math.random() * TAGS.length)], crossed: false,
        });
        g.spawn = (Math.max(0.42, 1.05 - g.score * 0.01) * (0.8 + Math.random() * 0.4)) / slow;
      }

      let caught = 0, lost = 0;
      g.pages = g.pages.filter((p) => {
        p.y += p.v * dt;
        p.rot += p.spin * dt;
        if (!p.crossed && p.y + PAGE_H / 2 >= BASKET_Y) { // the moment the page reaches the basket rim
          p.crossed = true;
          if (Math.abs(p.x - g.bx) <= BASKET_W / 2 + PAGE_W / 4) { caught++; return false; }
        }
        if (p.y - PAGE_H / 2 > H) { lost++; return false; }
        return true;
      });
      if (caught) { g.score += caught; if (!reduce) g.pulse = 1; setScore(g.score); }
      if (lost) { g.lives = Math.max(0, g.lives - lost); setLives(g.lives); }
      g.pulse = Math.max(0, g.pulse - dt * 6);

      ctx.clearRect(0, 0, W, H);
      for (const p of g.pages) drawPage(ctx, p);
      drawBasket(ctx, g.bx, g.pulse);

      if (g.lives <= 0) {
        setBest((b) => Math.max(b, g.score));
        setPhase('over');
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [phase]);

  /* after game over, put the focus on "Play again" */
  useEffect(() => {
    if (phase === 'over') againRef.current?.focus({ preventScroll: true });
  }, [phase]);

  /* mouse and touch: the basket follows the pointer (drag on a phone) */
  const follow = (e: PointerEvent<HTMLCanvasElement>) => {
    if (phase !== 'playing') return;
    const r = e.currentTarget.getBoundingClientRect();
    game.current.bx = clamp(((e.clientX - r.left) / r.width) * W, BASKET_W / 2, W - BASKET_W / 2);
  };

  const dialog = (
    <div ref={dialogRef} className={s.gcDialog} role="dialog" aria-modal="true" aria-label="Lost page catcher" tabIndex={-1} onKeyDown={trap} data-lenis-prevent>
      <div className={s.gcTop}>
        <span className={s.gcBrand}>Lost page catcher</span>
        <button type="button" className={s.gcClose} onClick={closeGame} aria-label="Close game">
          Close
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      </div>

      <div className={s.gc}>
        <div className={s.gcStage}>
          <canvas
            ref={canvasRef} className={s.gcCanvas} width={W} height={H} role="img"
            aria-label="Game area: pages fall from the top and you catch them in a basket"
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); follow(e); }}
            onPointerMove={follow}
          />

          <div className={s.gcHud}>
            <p className={s.gcScore} aria-live="polite">
              <span className={s.gcNum}>{score}</span>
              <span className={s.gcOf}>/ 404</span>
              <span className={s.gcLabel}>pages found</span>
            </p>
            <div className={s.gcLives} role="img" aria-label={`${lives} of ${MAX_LIVES} lives left`}>
              {Array.from({ length: MAX_LIVES }, (_, i) => <span key={i} className={s.gcLife} data-lost={i >= lives} />)}
            </div>
          </div>

          {phase === 'ready' && (
            <div className={s.gcOverlay}>
              <h3 className={s.gcTitle}>Pages keep going missing</h3>
              <p className={s.gcText}>Catch them before they hit the ground. Three misses and the page is lost.</p>
              <button type="button" ref={playRef} className={s.btn} onClick={start}>Play</button>
            </div>
          )}
          {phase === 'over' && (
            <div className={s.gcOverlay}>
              <h3 className={s.gcTitle}>Page lost.</h3>
              <p className={s.gcText}>
                You caught {score} page{score === 1 ? '' : 's'}.{best > 0 && <> Best this visit: {best}.</>}
              </p>
              <div className={s.gcActions}>
                <button type="button" ref={againRef} className={s.btn} onClick={start}>Play again</button>
                <Link href="/" className={s.btnGhost}>Back home</Link>
              </div>
            </div>
          )}
        </div>
        <p className={s.gcHint}>Arrow keys, A / D, or drag to move the basket. Esc closes.</p>
      </div>
    </div>
  );

  return (
    <>
      <button type="button" ref={launchRef} className={s.btnGhost} onClick={openGame}>Want to play a game?</button>
      {open && createPortal(dialog, document.body)}
    </>
  );
}
