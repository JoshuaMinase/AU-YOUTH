'use client';
import { useEffect, useLayoutEffect, useState, type DependencyList, type RefObject } from 'react';
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

/** Copy text to the clipboard; resolves false if the browser refuses. */
export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}
