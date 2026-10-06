'use client';
import { useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import Nav from '../Nav';
import Footer from '../Footer';
import { useIso, useReveal } from '../../lib/hooks';
import s from '../../styles/Site.module.css';

/** Nav + page + footer for the public pages, with scroll reveals and hero parallax. */
export default function SiteShell({ children }: { children: ReactNode }) {
  const main = useRef<HTMLElement>(null);
  useReveal(main);

  /* gentle parallax on the hero pattern */
  useIso(() => {
    const el = main.current?.querySelector('[data-hero-pattern]');
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tw = gsap.fromTo(el, { yPercent: 0, scale: 1.08 }, { yPercent: 8, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top top', end: 'bottom top', scrub: true } });
    return () => { tw.scrollTrigger?.kill(); tw.kill(); };
  }, []);

  return (
    <>
      <Nav />
      <main ref={main} className={s.main}>{children}</main>
      <Footer />
    </>
  );
}
