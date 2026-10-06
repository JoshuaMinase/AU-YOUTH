'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { NAV_LINKS } from './layout';
import { useIso } from '../lib/hooks';
import s from '../styles/Nav.module.css';

gsap.registerPlugin(ScrollTrigger);

/** Full glass pill at the top of the page. After ~100px of scroll (desktop) it morphs
 *  into a compact floating pill: the wordmark collapses, only logo + links stay.
 *  On small screens the links move into a slide-down menu. */
export default function Nav() {
  const pathname = usePathname();
  const nav = useRef<HTMLElement>(null);
  const links = useRef<HTMLUListElement>(null);
  const wm = useRef<HTMLSpanElement>(null);
  const gap = useRef<HTMLSpanElement>(null);
  const logo = useRef<HTMLImageElement>(null);
  const actions = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  /* --u = px per design pixel of the 1440-wide canvas */
  useIso(() => {
    const setU = () => document.documentElement.style.setProperty('--u', `${document.documentElement.clientWidth / 1440}px`);
    setU();
    window.addEventListener('resize', setU);
    return () => window.removeEventListener('resize', setU);
  }, []);

  useIso(() => {
    const el = nav.current!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mm = gsap.matchMedia();

    if (!reduce) gsap.from(el, { yPercent: -170, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.1, clearProps: 'transform,opacity' });

    mm.add('(min-width: 901px)', () => {
      const parts = [el, wm.current, gap.current, logo.current];
      const props = 'width,height,top,borderRadius,backgroundColor,boxShadow,paddingLeft,paddingRight,opacity';
      const compactW = () => 2 * 22 + 34 + 18 + (links.current?.offsetWidth ?? 0) + 24 + (actions.current?.offsetWidth ?? 0) + 8;
      const dur = reduce ? 0 : 0.6;
      let compact = false;

      const toCompact = (d = dur) => {
        gsap.to(el, { width: compactW(), height: 52, top: 14, borderRadius: 18, paddingLeft: 22, paddingRight: 22,
          backgroundColor: 'rgba(236,236,236,0.92)', boxShadow: '0 12px 34px rgba(3,34,16,.28)', duration: d, ease: 'power3.inOut', overwrite: 'auto' });
        gsap.to(wm.current, { width: 0, opacity: 0, duration: d, ease: 'power3.inOut', overwrite: 'auto' });
        gsap.to(gap.current, { width: 18, duration: d, ease: 'power3.inOut', overwrite: 'auto' });
        gsap.to(logo.current, { height: 34, duration: d, ease: 'power3.inOut', overwrite: 'auto' });
      };
      /* expanded values mirror Nav.module.css, so clearing inline styles afterwards is seamless */
      const toFull = () => {
        const u = document.documentElement.clientWidth / 1440;
        const ease = 'power3.inOut';
        gsap.to(el, { width: Math.min(1312 * u, document.documentElement.clientWidth - 24), height: Math.max(56, 59 * u), top: Math.max(12, 35 * u),
          borderRadius: Math.max(12, 12 * u), paddingLeft: Math.max(14, 23 * u), paddingRight: Math.max(14, 23 * u),
          backgroundColor: 'rgba(236,236,236,0.8)', boxShadow: '0 0 0 rgba(3,34,16,0)', duration: dur, ease, overwrite: 'auto',
          onComplete: () => gsap.set(parts, { clearProps: props }) });
        gsap.to(wm.current, { width: 99 * u, opacity: 1, duration: dur, ease, overwrite: 'auto' });
        gsap.to(gap.current, { width: document.documentElement.clientWidth <= 1100 ? 24 : 165 * u, duration: dur, ease, overwrite: 'auto' });
        gsap.to(logo.current, { height: Math.max(38, 54 * u), duration: dur, ease, overwrite: 'auto' });
      };

      const st = ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: (self) => {
          const c = self.scroll() > 100;
          if (c !== compact) { compact = c; c ? toCompact() : toFull(); }
        },
      });
      if (st.scroll() > 100) { compact = true; toCompact(0); }
      const onRefresh = () => { if (compact) toCompact(0); };
      ScrollTrigger.addEventListener('refresh', onRefresh);
      return () => { ScrollTrigger.removeEventListener('refresh', onRefresh); st.kill(); gsap.set(parts, { clearProps: props }); };
    });

    return () => mm.revert();
  }, []);

  /* close the mobile menu on navigation / Escape */
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const isActive = (h: string) => (h === '/' ? pathname === '/' : pathname.startsWith(h));

  return (
    <>
      <header ref={nav} className={s.nav} id="top" data-open={open ? '' : undefined}>
        <Link className={s.brand} href="/" aria-label="AU Youth Community — home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={logo} className={s.logo} src="/assets/logo.svg" alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <span ref={wm} className={s.wm}><img src="/assets/wordmark.svg" alt="" /></span>
        </Link>
        <span ref={gap} className={s.gap} />
        <ul ref={links} className={s.links}>
          {NAV_LINKS.map(([t, h]) => (
            <li key={t}>
              <Link href={h} aria-current={isActive(h) ? 'page' : undefined}>{t}</Link>
            </li>
          ))}
        </ul>
        <div ref={actions} className={s.navActions}>
          <Link href="/login" className={s.loginBtn}>Login</Link>
          <Link href="/sign-up" className={s.signIn}>Join the Network</Link>
        </div>
        <button type="button" className={s.burger} aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen((o) => !o)}>
          <span /><span />
        </button>
      </header>

      <div id="site-menu" className={s.menu} data-open={open ? '' : undefined} aria-hidden={!open}>
        <ul>
          {NAV_LINKS.map(([t, h], i) => (
            <li key={t} style={{ transitionDelay: open ? `${60 + i * 40}ms` : '0ms' }}>
              <Link href={h} tabIndex={open ? 0 : -1} aria-current={isActive(h) ? 'page' : undefined} onClick={() => setOpen(false)}>{t}</Link>
            </li>
          ))}
        </ul>
        <div className={s.menuActions}>
          <Link href="/login" tabIndex={open ? 0 : -1} className={s.loginBtn}>Login</Link>
          <Link href="/sign-up" tabIndex={open ? 0 : -1} className={s.signIn}>Join the Network</Link>
        </div>
      </div>
      <div className={s.scrim} data-open={open ? '' : undefined} onClick={() => setOpen(false)} aria-hidden="true" />
    </>
  );
}
