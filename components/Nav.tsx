'use client';
import { useLayoutEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BOX } from './assetBoxes';
import { NAV_LINKS } from './layout';
import s from '../styles/Nav.module.css';

gsap.registerPlugin(ScrollTrigger);

/** Full pill at the top of the hero. After ~80px of scroll it morphs into a compact
 *  floating pill: wordmark collapses away, only the logo mark + links stay. */
export default function Nav({ stage }: { stage: RefObject<HTMLElement | null> }) {
  const nav = useRef<HTMLElement>(null);
  const links = useRef<HTMLUListElement>(null);
  const wm = useRef<HTMLSpanElement>(null);
  const gap = useRef<HTMLSpanElement>(null);
  const logo = useRef<HTMLImageElement>(null);
  const signInRef = useRef<HTMLAnchorElement>(null);
  const loginRef = useRef<HTMLAnchorElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const compactW = () => 2 * 22 + 34 + 18 + (links.current?.offsetWidth ?? 0) + 24 + (signInRef.current?.offsetWidth ?? 0) + (loginRef.current?.offsetWidth ?? 0) + 40;
      const tl = gsap.timeline({ paused: true, defaults: { duration: 0.75, ease: 'power3.inOut' } })
        .to(nav.current, { width: compactW, height: 52, top: 14, borderRadius: 18,
          backgroundColor: 'rgba(236,236,236,0.9)', backdropFilter: 'blur(20px) saturate(180%)', boxShadow: '0 12px 34px rgba(3,34,16,.28)' }, 0)
        .to(wm.current, { width: 0, opacity: 0 }, 0)
        .to(gap.current, { width: 18 }, 0)
        .to(logo.current, { height: 34 }, 0)
        .to(nav.current, { paddingLeft: 22, paddingRight: 22 }, 0);

      gsap.from(nav.current, { yPercent: -170, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.15 });

      let compact = false;
      ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: (self) => {
          const c = self.scroll() > 100;
          if (c !== compact) { compact = c; c ? tl.play() : tl.reverse(); }
        },
      });
      const onRefresh = () => tl.invalidate();
      ScrollTrigger.addEventListener('refresh', onRefresh);
      return () => ScrollTrigger.removeEventListener('refresh', onRefresh);
    }, nav);
    return () => ctx.revert();
  }, [stage]);

  return (
    <header ref={nav} className={s.nav} id="top">
      <a
        className={s.brand}
        href="#top"
        aria-label="AU Youth Community — home"
        onPointerDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.97)';
          e.currentTarget.style.transition = 'transform 100ms ease-out';
        }}
        onPointerUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onPointerLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <img ref={logo} className={s.logo} src="/assets/logo.svg" alt="" />
        <span ref={wm} className={s.wm}><img src="/assets/wordmark.svg" alt="" /></span>
      </a>
      <span ref={gap} className={s.gap} />
      <ul ref={links} className={s.links}>
        {NAV_LINKS.map(([t, h]) => (
          <li key={t}>
            <a
              href={h}
              onPointerDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.97)';
                e.currentTarget.style.transition = 'transform 100ms ease-out';
              }}
              onPointerUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {t}
            </a>
          </li>
        ))}
      </ul>
      <div className={s.navActions}>
        <a ref={loginRef} href="/login" className={s.loginBtn}>Login</a>
        <a ref={signInRef} href="/sign-up" className={s.signIn}>Join the Network</a>
      </div>
    </header>
  );
}
