'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Nav from './Nav';
import { BOX } from './assetBoxes';
import { W, H, HERO_H, PANEL_Y, SLOT, POSE, PLACES, BASE_AT, CARDS, WORDS, WORD_TOP, box } from './layout';
import { useIso } from '../lib/hooks';
import s from '../styles/Landing.module.css';

gsap.registerPlugin(ScrollTrigger);
const A = (n: string) => `/assets/${n}.svg`;
const pct = (v: number) => `${(v / H) * 100}%`;

const TYPING_WORDS = ['connect.', 'experience.', 'learn.'] as const;
/** where each hero card leads */
const CARD_HREF: Record<string, string> = { gold: '/community', blue: '/dashboard/news', green: '/why-join', yellow: '/opportunities' };

/** Typewriter loop. Lives in its own component so its 10–20 state updates per second
 *  re-render only this <span>, not the whole hero. */
function TypingWord({ style }: { style: React.CSSProperties }) {
  const [state, setState] = useState({ word: 0, chars: 0, deleting: false });
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const id = setInterval(() => setState((p) => ({ word: (p.word + 1) % TYPING_WORDS.length, chars: 99, deleting: false })), 2200);
      return () => clearInterval(id);
    }
    const word = TYPING_WORDS[state.word];
    const full = !state.deleting && state.chars >= word.length;
    const empty = state.deleting && state.chars === 0;
    const delay = full ? 1500 : empty ? 500 : state.deleting ? 50 : 100;
    const id = setTimeout(() => setState((p) => {
      if (full) return { ...p, deleting: true };
      if (empty) return { word: (p.word + 1) % TYPING_WORDS.length, chars: 0, deleting: false };
      return { ...p, chars: p.chars + (p.deleting ? -1 : 1) };
    }), delay);
    return () => clearTimeout(id);
  }, [state]);
  const word = TYPING_WORDS[state.word];
  return (
    <div className={s.typingContainer} style={style} aria-hidden="true">
      <span className={s.typingText} data-word={word}>{word.slice(0, state.chars)}</span>
      <span className={s.cursor}></span>
    </div>
  );
}

export default function Landing() {
  const stage = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);
  useIso(() => {
    const el = stage.current!;
    const u = () => el.clientWidth / W;
    const setU = () => document.documentElement.style.setProperty('--u', `${u()}px`);
    setU();
    const ro = new ResizeObserver(setU); ro.observe(el);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const q = gsap.utils.selector(el);
    const cards = q('[data-card]') as HTMLElement[];
    const hoverCleanups: (() => void)[] = [];

    const ctx = gsap.context(() => {
      /* ---------- card poses ---------- */
      const posed = (i: number, place: number) => {
        const p = PLACES[place];
        return {
          x: (p.x + POSE.w / 2 - (CARDS[i].slot.x + SLOT.w / 2)) * u(),
          y: (p.y + POSE.h / 2 - (CARDS[i].slot.y + SLOT.h / 2)) * u(),
          scale: POSE.w / SLOT.w, rotation: 0,
        };
      };
      const base = () => cards.forEach((c, i) => {
        gsap.set(c, { ...posed(i, BASE_AT[i]), zIndex: PLACES[BASE_AT[i]].z });
      });
      base();

      /* ---------- carousel shuffle ---------- */
      let at = [...BASE_AT];
      let timer: gsap.core.Tween | null = null;
      const shuf = gsap.timeline({ defaults: { overwrite: 'auto' } });
      let shuffling = false;
      const step = () => {
        shuf.clear();
        const next = at.map((p) => (p + 3) % 4);
        next.forEach((np, i) => {
          const c = cards[i], wrap = at[i] === 0, arriving = np === 2;
          const to = posed(i, np);
          gsap.set(c, { zIndex: arriving ? 5 : wrap ? 0 : PLACES[np].z });
          shuf.to(c, { ...to, duration: 0.85, delay: arriving ? 0 : 0.06, ease: 'power3.inOut' }, 0);
          if (arriving || wrap) shuf.set(c, { zIndex: PLACES[np].z }, 0.9);
        });
        at = next;
        timer = gsap.delayedCall(2.75, step);
      };
      const startShuffle = () => { if (shuffling || reduce) return; shuffling = true; timer = gsap.delayedCall(1.6, step); };
      const stopShuffle = () => {
        if (!shuffling) return; shuffling = false;
        timer?.kill(); shuf.clear(); at = [...BASE_AT];
        cards.forEach((c, i) => {
          gsap.set(c, { zIndex: PLACES[at[i]].z });
          gsap.to(c, { ...posed(i, at[i]), duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
        });
      };

      /* ---------- scroll flight ---------- */
      const slotCenterY = CARDS[0].slot.y + SLOT.h / 2;
      const flight = gsap.timeline({
        defaults: { overwrite: 'auto' },
        scrollTrigger: {
          start: 0, 
          end: () => `+=${Math.max(300, slotCenterY * u() - innerHeight * 0.5)}`, // even shorter for less lag
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => { self.scroll() < 6 ? startShuffle() : stopShuffle(); },
        },
      });
      cards.forEach((c, i) => {
        const at0 = 0.05 + i * 0.06; // even tighter stagger for faster progression
        flight.fromTo(c, { ...posed(i, BASE_AT[i]) },
          { x: 0, y: 0, scale: 1, duration: 0.5, ease: 'power2.out', immediateRender: false }, at0) // faster, more responsive
          .to(c, { rotation: i % 2 ? -4 : 4, duration: 0.25, ease: 'power2.out' }, at0) // quicker rotation
          .to(c, { rotation: 0, duration: 0.25, ease: 'power2.in' }, at0 + 0.25); // quicker counter-rotation
      });
      flight.fromTo(q('[data-labels]'), { opacity: 0, y: 14 * u() }, { opacity: 1, y: 0, duration: 0.15, ease: 'power2.out', immediateRender: false }, 0.6); // faster labels
      if (window.scrollY < 6) startShuffle();

      /* ---------- card hover: dark overlay + label ---------- */
      if (!reduce) {
        cardRefs.current.forEach((card) => {
          const overlay = card.querySelector('[data-hover-overlay]');
          const label = card.querySelector('[data-hover-label]');
          const onEnter = () => {
            gsap.to(overlay, { opacity: 1, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
            gsap.to(label, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
          };
          const onLeave = () => {
            gsap.to(overlay, { opacity: 0, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
            gsap.to(label, { opacity: 0, y: 12, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
          };
          card.addEventListener('mouseenter', onEnter);
          card.addEventListener('mouseleave', onLeave);
          card.addEventListener('focusin', onEnter);
          card.addEventListener('focusout', onLeave);
          hoverCleanups.push(() => {
            card.removeEventListener('mouseenter', onEnter);
            card.removeEventListener('mouseleave', onLeave);
            card.removeEventListener('focusin', onEnter);
            card.removeEventListener('focusout', onLeave);
          });
        });
      }

      /* ---------- hero intro, parallax ---------- */
      gsap.from(q('[data-in]'), { y: 34 * u(), opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.25 });
      gsap.set(q('[data-pattern]'), { scale: 1.08, transformOrigin: '50% 0%' });
      gsap.to(q('[data-pattern]'), { yPercent: -5, ease: 'none',
        scrollTrigger: { start: 0, end: () => `+=${H * u() * 0.5}`, scrub: true } });
      gsap.to(q('[data-herotext]'), { y: () => -40 * u(), ease: 'none',
        scrollTrigger: { start: 0, end: () => `+=${500 * u()}`, scrub: true, invalidateOnRefresh: true } });

      /* ---------- panel copy ---------- */
      q('[data-reveal]').forEach((t) => gsap.from(t, { y: 60 * u(), opacity: 0, duration: 1.2, ease: 'power2.out',
        scrollTrigger: { trigger: t, start: 'top 65%' } }));

      /* ---------- section heading — scroll-scrubbed word reveal ---------- */
      const headingEl = q('[data-section-heading]')[0] as HTMLElement | undefined;
      const subEl     = q('[data-section-sub]')[0]     as HTMLElement | undefined;

      if (!reduce && headingEl && subEl) {
        const headWords = Array.from(headingEl.querySelectorAll<HTMLElement>(`.${s.wordInner}`));
        const subWords  = Array.from(subEl.querySelectorAll<HTMLElement>(`.${s.wordInner}`));

        /* start everything hidden */
        gsap.set([...headWords, ...subWords], { y: '115%' });
        gsap.set(subWords, { opacity: 0 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: headingEl,
            start: 'top 65%',
            end:   'top 15%',
            scrub: 0.5,
            invalidateOnRefresh: true,
          },
        });

        /* heading words stagger in, each occupying its own slice of scroll */
        headWords.forEach((w, i) => {
          tl.to(w, { y: '0%', ease: 'power3.out', duration: 0.4 }, i * 0.35);
        });

        /* sub fades + rises after last heading word */
        tl.to(subWords, { y: '0%', opacity: 1, ease: 'power2.out', duration: 0.35, stagger: 0.06 },
          headWords.length * 0.35);

      } else {
        /* reduced-motion or SSR: show immediately */
        if (headingEl) gsap.set(headingEl.querySelectorAll<HTMLElement>(`.${s.wordInner}`), { y: '0%' });
        if (subEl)     gsap.set(subEl.querySelectorAll<HTMLElement>(`.${s.wordInner}`), { y: '0%', opacity: 1 });
      }
    }, el);

    return () => {
      hoverCleanups.forEach((f) => f());
      ro.disconnect();
      ctx.revert();
    };
  }, []);

  const word = (k: (typeof WORDS)[number]['key']) => ({ ...box({ ...BOX[k], y: WORD_TOP }) });
  return (
    <div className={s.page}>
      <Nav />
      <div ref={stage} className={s.stage}>
        <h1 className={s.sr}>Where you can connect, experience and learn — AU Youth Community</h1>
        <div className={`${s.frame} ${s.hero}`} style={{ height: pct(HERO_H) }}>
          <img data-pattern className={s.fill} src={A('pattern')} alt="" />
        </div>
        <div className={`${s.frame} ${s.panel}`} style={{ top: pct(PANEL_Y), height: pct(H - PANEL_Y) }}>
          <img className={s.panelPattern} src="/assets/section2-bg.svg" alt="" />
        </div>

        <div className={s.layer} data-herotext>
          <h2 data-in style={box(BOX.headline)} className={s.headlineText}>Where you can</h2>
          <TypingWord style={{ ...word('word-connect'), top: `${(250 / H) * 100}%` }} />
          <p data-in style={box(BOX.paragraph)} className={s.paragraphText}>Join a vibrant community of young people building meaningful connections, gaining valuable experiences, and learning together to shape a brighter future.</p>
        </div>

        <h2 className={s.sr}>The Experience You get</h2>
        <h3
          data-section-heading
          style={{ position: 'absolute', top: `${(747.8 / H) * 100}%`, left: '50%', transform: 'translateX(-50%)', width: `${(BOX.heading.w / W) * 100}%` }}
          className={s.headingText}
        >
          {['The', 'Experience', 'You', 'get'].map((w) => (
            <span key={w} className={s.wordMask}>
              <span className={s.wordInner}>{w}</span>
            </span>
          ))}
        </h3>
        <p
          data-section-sub
          style={{ position: 'absolute', top: `${(820 / H) * 100}%`, left: '50%', transform: 'translateX(-50%)', width: '60%' }}
          className={s.subheadingText}
        >
          {['Discover', 'endless', 'opportunities', 'for', 'growth', 'and', 'connection'].map((w) => (
            <span key={w} className={s.wordMask}>
              <span className={s.wordInner}>{w}</span>
            </span>
          ))}
        </p>

        {CARDS.map((c, i) => (
          <div key={c.id} data-card className={s.card}
            ref={(el) => { if (el) cardRefs.current[i] = el; }}
            style={{ ...box({ x: c.slot.x, y: c.slot.y, w: SLOT.w, h: SLOT.h }), zIndex: i + 1 }}>
            <Link href={CARD_HREF[c.id]} className={s.cardInner} style={{ background: c.color }} aria-label={c.label}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={s.cardPhoto} src={c.img} alt="" decoding="async" />
              <div data-hover-overlay className={s.hoverOverlay} />
              <div data-hover-label className={s.hoverLabel}>{c.label}</div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
