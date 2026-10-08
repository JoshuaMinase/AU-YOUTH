'use client';
import { useEffect, useLayoutEffect, useRef, useState, type DependencyList, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { startOfDay } from './data';

gsap.registerPlugin(ScrollTrigger);

export const useIso = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Today's date, computed on the client only (avoids SSR/timezone hydration mismatches). */
export function useToday() {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => { setToday(startOfDay(new Date())); }, []);
  return today;
}

/**
 * Entrance animations for a page/section.
 *  - `[data-w]` (words inside a SplitHeading) slide up on mount
 *  - `[data-reveal]` fade + rise as they scroll into view (batched, once)
 */
export function useReveal(scope: RefObject<HTMLElement | null>, deps: DependencyList = []) {
  useIso(() => {
    const root = scope.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const words = root.querySelectorAll('[data-w]');
      if (words.length) gsap.from(words, { yPercent: 110, duration: 0.9, ease: 'power3.out', stagger: 0.06, delay: 0.05 });

      const items = gsap.utils.toArray<HTMLElement>('[data-reveal]', root);
      if (!items.length) return;
      gsap.set(items, { y: 28, opacity: 0 });
      ScrollTrigger.batch(items, {
        start: 'top bottom-=20', // always reachable, even for the last element on the page
        once: true,
        onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.07, overwrite: true }),
      });
    }, root);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Small fade-up for a list that re-renders (filters, search). */
export function useListAnimation(scope: RefObject<HTMLElement | null>, key: unknown) {
  useIso(() => {
    const root = scope.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tw = gsap.fromTo(root.children, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 0.035, clearProps: 'transform,opacity' });
    return () => { tw.kill(); gsap.set(root.children, { clearProps: 'transform,opacity' }); };
  }, [key]);
}

/** Elements a sideways swipe must leave alone: form fields, dialogs, inner scroll panels. */
const NO_SWIPE = 'input,textarea,select,[contenteditable="true"],[data-no-swipe],[data-lenis-prevent],[role="dialog"]';

/**
 * Phone tab swipe (like Instagram): on screens where the tab bar shows, swipe the page
 * left/right to move to the neighbouring tab. The page follows the finger, slides out,
 * and the next page slides in from the same side (also when a tab is tapped).
 * `scope` is the page wrapper that is re-mounted on every route (keyed by pathname).
 */
export function useSwipeTabs(scope: RefObject<HTMLElement | null>, tabs: readonly string[], pathname: string,
  go: (href: string) => void, query = '(max-width: 860px)') {
  const last = useRef(-1);
  useIso(() => {
    const root = scope.current;
    if (!root) return;
    const mq = window.matchMedia(query);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const i = tabs.indexOf(pathname);

    /* slide the new page in from the side we are travelling towards */
    if (mq.matches && !reduce && i >= 0 && last.current >= 0 && i !== last.current) {
      const dir = i > last.current ? 1 : -1;
      gsap.fromTo(root, { x: dir * root.clientWidth * 0.3, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out', clearProps: 'transform,opacity' });
    }
    last.current = i;
    if (i < 0) return;   // only the main tabs swipe; articles, chats, profile don't

    const prev = tabs[i - 1], next = tabs[i + 1];
    let x0 = 0, y0 = 0, t0 = 0, dx = 0, leaving = false;
    let mode: 'off' | 'idle' | 'h' | 'v' = 'off';
    let safety: ReturnType<typeof setTimeout> | undefined;

    const blocked = (el: EventTarget | null) => {
      for (let n = el as HTMLElement | null; n && n !== root; n = n.parentElement) {
        if (n.matches(NO_SWIPE)) return true;
        if (n.scrollWidth > n.clientWidth + 1 && /(auto|scroll)/.test(getComputedStyle(n).overflowX)) return true;
      }
      return false;
    };
    const settle = () => gsap.to(root, { x: 0, opacity: 1, duration: 0.3, ease: 'power3.out', overwrite: true, clearProps: 'transform,opacity' });

    const onStart = (e: TouchEvent) => {
      mode = 'off';
      if (leaving || !mq.matches || e.touches.length > 1) return;
      const t = e.touches[0];
      if (t.clientX < 20 || t.clientX > window.innerWidth - 20) return;   // leave the phone's edge-back gesture alone
      if (blocked(e.target)) return;
      x0 = t.clientX; y0 = t.clientY; t0 = performance.now(); dx = 0; mode = 'idle';
    };
    const onMove = (e: TouchEvent) => {
      if (mode === 'off' || mode === 'v') return;
      const t = e.touches[0];
      dx = t.clientX - x0;
      const dy = t.clientY - y0;
      if (mode === 'idle') {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 10) return;
        mode = Math.abs(dx) > Math.abs(dy) * 1.3 ? 'h' : 'v';
        if (mode === 'v') return;
      }
      if (e.cancelable) e.preventDefault();
      const d = (dx > 0 ? prev : next) ? dx : dx * 0.2;   // rubber-band when there is no tab that way
      gsap.set(root, { x: d, opacity: 1 - Math.min(Math.abs(d) / root.clientWidth, 1) * 0.4 });
    };
    const onEnd = () => {
      if (mode !== 'h') { mode = 'off'; return; }
      mode = 'off';
      const w = root.clientWidth;
      const v = dx / Math.max(1, performance.now() - t0);   // px per ms
      const target = dx > 0 ? prev : next;
      if (!target || (Math.abs(dx) < w * 0.25 && (Math.abs(v) < 0.45 || Math.abs(dx) < 40))) { settle(); return; }
      leaving = true;
      gsap.to(root, { x: Math.sign(dx) * w, opacity: 0, duration: reduce ? 0 : 0.22, ease: 'power2.in', overwrite: true,
        onComplete: () => {
          go(target);
          /* navigation failed or was slow: bring the page back rather than leave it blank */
          safety = setTimeout(() => { leaving = false; settle(); }, 2500);
        } });
    };

    root.addEventListener('touchstart', onStart, { passive: true });
    root.addEventListener('touchmove', onMove, { passive: false });
    root.addEventListener('touchend', onEnd);
    root.addEventListener('touchcancel', onEnd);
    return () => {
      clearTimeout(safety);
      gsap.killTweensOf(root);
      root.removeEventListener('touchstart', onStart);
      root.removeEventListener('touchmove', onMove);
      root.removeEventListener('touchend', onEnd);
      root.removeEventListener('touchcancel', onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
}

/** Copy text to the clipboard; resolves false if the browser refuses. */
export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}
