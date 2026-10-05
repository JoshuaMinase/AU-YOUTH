'use client';
import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import s from '../styles/Footer.module.css';

gsap.registerPlugin(ScrollTrigger);
const useIso = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);

  useIso(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile  = window.innerWidth < 768;
    if (reduced || mobile) return;

    const ctx = gsap.context(() => {
      /* ── Text stagger-in ─────────────────────────────────────────── */
      gsap.from('[data-f]', {
        y: 20,
        opacity: 0,
        duration: 0.75,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: footer,
          start: 'top 55%',
          toggleActions: 'play none none none',
        },
      });

      /* ── Mandala subtle parallax ─────────────────────────────────── */
      gsap.to('[data-fp="mandala"]', {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: {
          trigger: footer,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });

      /* ── Zigzag subtle parallax ─────────────────────────────────── */
      gsap.to('[data-fp="zigzag"]', {
        yPercent: 5,
        ease: 'none',
        scrollTrigger: {
          trigger: footer,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });

      /* ── Folder parallax ─────────────────────────────────────────── */
      const folderWrap = document.querySelector('[data-folder-wrap]') as HTMLElement | null;
      if (folderWrap) {
        gsap.to(folderWrap, {
          y: 40,
          ease: 'none',
          scrollTrigger: {
            trigger: footer,
            start: 'top bottom',
            end: 'top top',
            scrub: true,
          },
        });
      }
    }, footer);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      id="footer"
      className={s.footer}
      aria-label="AU Youth Network footer"
    >
      {/* ── Decorative: Large African pattern — right side ───────────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        data-fp="mandala"
        src="/SVG/Asset%201the%20pattern.svg"
        alt=""
        aria-hidden="true"
        className={s.mandalaSvg}
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        data-fp="zigzag"
        src="/SVG/Asset%201the%20pattern.svg"
        alt=""
        aria-hidden="true"
        className={s.zigzagSvg}
      />

      {/* ── Content: three-column row ────────────────────────────────── */}
      <div className={s.inner}>

        {/* Column 1 — Logo + name */}
        <div className={s.logoCol}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            data-f
            src="/assets/logo.svg"
            alt="AU Youth Network Logo"
            className={s.logo}
          />
          <p data-f className={s.brand}>
            African Union<br />Youth Network
          </p>
        </div>

        {/* Column 2 — Words + tagline */}
        <div className={s.wordsCol}>
          <ul className={s.words}>
            {['Connect.', 'Learn.', 'Contribute.'].map((w, i) => (
              <li data-f key={i}>{w}</li>
            ))}
          </ul>
          <p data-f className={s.tag}>
            Connect with intention.&nbsp; Learn generously.&nbsp; Contribute with confidence.
          </p>
        </div>

        {/* Column 3 — Links + copyright */}
        <div className={s.linksCol}>
          <a data-f href="#">About</a>
          <a data-f href="#">Programs</a>
          <a data-f href="#">Events</a>
          <a data-f href="#">Contact</a>
          <p className={s.copyright}>
            © {new Date().getFullYear()} African Union Youth Network
          </p>
        </div>

      </div>
    </footer>
  );
}
