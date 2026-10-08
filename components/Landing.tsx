'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Nav from './Nav';
import { BOX } from './assetBoxes';
import {
  W, H, HERO_H, PANEL_Y, SLOT, POSE, PLACES, BASE_AT, CARDS, place,
  MOBILE_MQ, M_W, M_H, M_HERO_H, M_PANEL_Y, M_SLOT, M_POSE, M_PLACES, M_SLOTS, M_BOX,
} from './layout';
import { useIso } from '../lib/hooks';
import s from '../styles/Landing.module.css';

gsap.registerPlugin(ScrollTrigger);
const A = (n: string) => `/assets/${n}.svg`;

const TYPING_WORDS = ['connect.', 'experience.', 'learn.'] as const;
/** where each hero card leads */
const CARD_HREF: Record<string, string> = { gold: '/community', blue: '/dashboard/news', green: '/why-join', yellow: '/opportunities' };

/** the two canvases the hero can run on (CSS picks the matching boxes with the same media query) */
const CANVAS = {
  desktop: { w: W, slot: SLOT, pose: POSE, places: PLACES, slots: CARDS.map((c) => c.slot) },
  mobile:  { w: M_W, slot: M_SLOT, pose: M_POSE, places: M_PLACES, slots: M_SLOTS },
};
/** scroll timeline: card i starts flying at 0.05 + i·0.06 and takes 0.5 */
const FLY = 0.5, FLY_END = 0.05 + (CARDS.length - 1) * 0.06 + FLY;
const out2 = (t: number) => 1 - (1 - t) * (1 - t);
const in2 = (t: number) => t * t;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

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
    <div className={`${s.abs} ${s.typingContainer}`} style={style} aria-hidden="true">
      <span className={s.typingText}>{word.slice(0, state.chars)}</span>
      <span className={s.cursor}></span>
    </div>
  );
}

export default function Landing() {
  const stage = useRef<HTMLDivElement>(null);
  const introDone = useRef(false);

  useIso(() => {
    const el = stage.current!;
    const q = gsap.utils.selector(el);
    const cards = q('[data-card]') as HTMLElement[];
    const mm = gsap.matchMedia();

    /* re-runs (and reverts the previous run) whenever the layout or motion preference flips.
       `desktop` is listed so at least one condition always matches (matchMedia skips the callback otherwise). */
    mm.add({ mobile: MOBILE_MQ, desktop: `not all and ${MOBILE_MQ}`, reduce: '(prefers-reduced-motion: reduce)' }, (mctx) => {
      const { mobile, reduce } = mctx.conditions as { mobile: boolean; reduce: boolean };
      const L = mobile ? CANVAS.mobile : CANVAS.desktop;
      const u = () => el.clientWidth / L.w;
      const headingWords = q(`[data-section-heading] .${s.wordInner}`);
      const subWords = q(`[data-section-sub] .${s.wordInner}`);

      /* reduced motion: final state — cards sit in the grid, heading shown */
      if (reduce) {
        gsap.set(cards, { x: 0, y: 0, scale: 1, rotation: 0 });
        return;
      }

      /* ---------- card poses (design units, so they survive any resize) ---------- */
      const posed = (i: number, at: number) => {
        const p = L.places[at], sl = L.slots[i];
        return {
          x: p.x + L.pose.w / 2 - (sl.x + L.slot.w / 2),
          y: p.y + L.pose.h / 2 - (sl.y + L.slot.h / 2),
          s: L.pose.w / L.slot.w,
        };
      };
      /* hero pose of each card (animated by the shuffle) + scroll progress (animated by the scrub).
         Separate objects, so the two animations can never overwrite each other. */
      const hero = cards.map((_, i) => posed(i, BASE_AT[i]));
      const fly = { p: 0 };

      const render = () => {
        const k = u();
        cards.forEach((c, i) => {
          const t = clamp01((fly.p - (0.05 + i * 0.06)) / FLY);
          const e = out2(t), h = hero[i], tilt = i % 2 ? -4 : 4;
          gsap.set(c, {
            x: h.x * (1 - e) * k,
            y: h.y * (1 - e) * k,
            scale: h.s + (1 - h.s) * e,
            rotation: t < 0.5 ? tilt * out2(t * 2) : tilt * (1 - in2(t * 2 - 1)),
          });
        });
      };
      cards.forEach((c, i) => gsap.set(c, { zIndex: L.places[BASE_AT[i]].z }));

      /* ---------- carousel shuffle (only while the page is at the very top) ---------- */
      let at = [...BASE_AT];
      let timer: gsap.core.Tween | null = null;
      let shuf: gsap.core.Timeline | null = null;
      let shuffling = false;
      const step = () => {
        const next = at.map((p) => (p + 3) % 4);
        shuf = gsap.timeline({ onUpdate: render });
        next.forEach((np, i) => {
          const c = cards[i], wrap = at[i] === 0, arriving = np === 2;
          gsap.set(c, { zIndex: arriving ? 5 : wrap ? 0 : L.places[np].z });
          shuf!.to(hero[i], { ...posed(i, np), duration: 0.85, ease: 'power3.inOut' }, arriving ? 0 : 0.06);
          if (arriving || wrap) shuf!.set(c, { zIndex: L.places[np].z }, 0.9);
        });
        at = next;
        timer = gsap.delayedCall(2.75, step);
      };
      const startShuffle = () => {
        if (shuffling) return;
        shuffling = true;
        timer = gsap.delayedCall(1.6, step);
      };
      const stopShuffle = () => {
        if (!shuffling) return;
        shuffling = false;
        timer?.kill(); shuf?.kill(); shuf = null;
        at = [...BASE_AT];
        cards.forEach((c, i) => {
          gsap.set(c, { zIndex: L.places[at[i]].z });
          gsap.to(hero[i], { ...posed(i, at[i]), duration: 0.4, ease: 'power2.out', overwrite: true, onUpdate: render });
        });
      };

      /* ---------- scroll flight: hero stack → grid ---------- */
      const firstSlot = L.slots[0].y + L.slot.h / 2;
      gsap.to(fly, {
        p: FLY_END, ease: 'none', onUpdate: render,
        scrollTrigger: {
          start: 0,
          end: () => `+=${Math.max(300, firstSlot * u() - innerHeight * 0.5)}`,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => { self.scroll() < 6 ? startShuffle() : stopShuffle(); },
        },
      });
      render();
      if (window.scrollY < 6) startShuffle();

      /* keep cards glued to the layout while the stage resizes (rotation, window drag) */
      const ro = new ResizeObserver(render);
      ro.observe(el);

      /* ---------- hero intro (once per visit, not on every breakpoint change), parallax ---------- */
      if (!introDone.current) {
        introDone.current = true;
        gsap.from(q('[data-in]'), { y: 34 * u() * (mobile ? 0.5 : 1), opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.25, clearProps: 'transform,opacity' });
      }
      gsap.set(q('[data-pattern]'), { scale: 1.08, transformOrigin: '50% 0%' });
      gsap.to(q('[data-pattern]'), { yPercent: -5, ease: 'none',
        scrollTrigger: { start: 0, end: () => `+=${el.clientHeight * 0.4}`, scrub: true, invalidateOnRefresh: true } });
      gsap.to(q('[data-herotext]'), { y: () => -40 * u(), ease: 'none',
        scrollTrigger: { start: 0, end: () => `+=${500 * u()}`, scrub: true, invalidateOnRefresh: true } });

      /* ---------- section heading — scroll-scrubbed word reveal ---------- */
      gsap.set(headingWords, { y: '115%' });
      gsap.set(subWords, { y: '115%', opacity: 0 });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: q('[data-section-heading]')[0],
          start: 'top 85%',
          end: 'top 35%',
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });
      headingWords.forEach((w, i) => { tl.to(w, { y: '0%', ease: 'power3.out', duration: 0.4 }, i * 0.35); });
      tl.to(subWords, { y: '0%', opacity: 1, ease: 'power2.out', duration: 0.35, stagger: 0.06 }, headingWords.length * 0.35);

      return () => {
        ro.disconnect();
        timer?.kill(); shuf?.kill();
        gsap.killTweensOf(hero);
      };
    });

    return () => mm.revert();
  }, []);

  const typingBox = { ...BOX['word-connect'], y: 250 };
  const headingBox = { x: (W - BOX.heading.w) / 2, y: 747.8, w: BOX.heading.w, h: BOX.heading.h };
  return (
    <div className={s.page}>
      <Nav />
      <div ref={stage} className={s.stage}>
        <h1 className={s.sr}>Where you can connect, experience and learn — AU Youth Community</h1>
        <div className={`${s.abs} ${s.frame} ${s.hero}`} style={place({ x: 0, y: 0, w: W, h: HERO_H }, { x: 0, y: 0, w: M_W, h: M_HERO_H })}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img data-pattern className={s.fill} src={A('pattern')} alt="" aria-hidden="true" />
        </div>
        <div className={`${s.abs} ${s.frame} ${s.panel}`} style={place({ x: 0, y: PANEL_Y, w: W, h: H - PANEL_Y }, { x: 0, y: M_PANEL_Y, w: M_W, h: M_H - M_PANEL_Y })}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.panelPattern} src="/assets/section2-bg.svg" alt="" aria-hidden="true" />
        </div>

        <div className={s.layer} data-herotext>
          <h2 data-in style={place(BOX.headline, M_BOX.headline)} className={`${s.abs} ${s.headlineText}`}>Where you can</h2>
          <TypingWord style={place(typingBox, M_BOX.typing)} />
          <p data-in style={place(BOX.paragraph, M_BOX.paragraph)} className={`${s.abs} ${s.paragraphText}`}>Join a vibrant community of young people building meaningful connections, gaining valuable experiences, and learning together to shape a brighter future.</p>
        </div>

        <h2 className={s.sr}>The Experience You get</h2>
        <h3 data-section-heading style={place(headingBox, M_BOX.heading)} className={`${s.abs} ${s.headingText}`} aria-hidden="true">
          {['The', 'Experience', 'You', 'get'].map((w) => (
            <span key={w} className={s.wordMask}>
              <span className={s.wordInner}>{w}</span>
            </span>
          ))}
        </h3>
        <p data-section-sub style={place({ x: W * 0.2, y: 820, w: W * 0.6, h: 22 }, M_BOX.sub)} className={`${s.abs} ${s.subheadingText}`}>
          {['Discover', 'endless', 'opportunities', 'for', 'growth', 'and', 'connection'].map((w) => (
            <span key={w} className={s.wordMask}>
              <span className={s.wordInner}>{w}</span>
            </span>
          ))}
        </p>

        {CARDS.map((c, i) => (
          <div key={c.id} data-card className={`${s.abs} ${s.card}`}
            style={{ ...place({ ...c.slot, ...SLOT }, { ...M_SLOTS[i], ...M_SLOT }), zIndex: i + 1 }}>
            <Link href={CARD_HREF[c.id]} className={s.cardInner} style={{ background: c.color }} aria-label={c.label}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={s.cardPhoto} src={c.img} alt="" decoding="async" />
              <div className={s.hoverOverlay} />
              <div className={s.hoverLabel} aria-hidden="true">{c.label}</div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
