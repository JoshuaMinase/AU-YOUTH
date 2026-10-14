'use client';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import s from '@/styles/Portal.module.css';

const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';
const OUT_MS = 220;

/**
 * Mobile bottom sheet: slides up, closes on a tap outside, Escape or a swipe down on the handle.
 * Focus moves into the sheet, stays inside while it is open and goes back to the opener on close.
 * `children` is a function so an item can close the sheet with the slide-down animation.
 */
export default function BottomSheet({ open, onClose, title, id, children }: {
  open: boolean; onClose: () => void; title: string; id: string;
  children: (close: () => void) => ReactNode;
}) {
  const [closing, setClosing] = useState(false);
  const sheet = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const drag = useRef({ y0: 0, dy: 0, t0: 0, on: false });

  const close = useCallback(() => {
    if (timer.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { onClose(); return; }
    const el = sheet.current;   // forget any drag leftovers so the slide-down class takes over
    if (el) { el.style.animation = ''; el.style.transition = ''; el.style.transform = ''; }
    setClosing(true);
    timer.current = setTimeout(() => { timer.current = undefined; setClosing(false); onClose(); }, OUT_MS);
  }, [onClose]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  /* focus in on open, back to the opener on close; Escape closes; Tab stays inside */
  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement as HTMLElement | null;
    const first = sheet.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? sheet.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab' || !sheet.current) return;
      const els = Array.from(sheet.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!els.length) return;
      const a = els[0], z = els[els.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      else if (!sheet.current.contains(document.activeElement)) { e.preventDefault(); a.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      opener.current?.focus?.();
    };
  }, [open, close]);

  /* swipe down on the handle: follow the finger, then close or spring back */
  const onDown = (e: React.PointerEvent) => {
    drag.current = { y0: e.clientY, dy: 0, t0: performance.now(), on: true };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (sheet.current) { sheet.current.style.animation = 'none'; sheet.current.style.transition = 'none'; }
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.on || !sheet.current) return;
    d.dy = Math.max(0, e.clientY - d.y0);
    sheet.current.style.transform = `translateY(${d.dy}px)`;
  };
  const onUp = () => {
    const d = drag.current, el = sheet.current;
    if (!d.on || !el) return;
    d.on = false;
    const fast = d.dy / Math.max(1, performance.now() - d.t0) > 0.5;
    el.style.transition = `transform ${OUT_MS}ms ease-out`;
    if (d.dy > 90 || (fast && d.dy > 30)) {
      el.style.transform = 'translateY(100%)';
      if (timer.current) return;
      timer.current = setTimeout(() => { timer.current = undefined; onClose(); }, OUT_MS);
      setClosing(true);
    } else {
      el.style.transform = '';
    }
  };

  if (!open) return null;
  return (
    <div className={`${s.sheetScrim} ${closing ? s.sheetScrimOut : ''}`} data-lenis-prevent
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div ref={sheet} id={id} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} data-lenis-prevent data-no-swipe
        className={`${s.sheet} ${closing ? s.sheetOut : ''}`}>
        <div className={s.sheetGrab} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} aria-hidden="true">
          <span className={s.sheetHandle} />
        </div>
        <h2 className={s.sheetTitle}>{title}</h2>
        {children(close)}
      </div>
    </div>
  );
}
