'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import IdeasFolder from './IdeasFolder';
import { FOLDER_ART, IDEAS } from './ideasConfig';
import s from '../styles/IdeasSection.module.css';

gsap.registerPlugin(ScrollTrigger);
const useIso = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Section 4 — "All of our ideas in one place"
 *  Text sits top-left. The folder is large, bottom-anchored, bleeds
 *  into the footer. A 6px green strip runs along the bottom edge. */
export default function IdeasSection() {
  const root      = useRef<HTMLElement>(null);
  const stageRef  = useRef<HTMLDivElement>(null);
  const [stageW, setStageW] = useState<number>(FOLDER_ART.w * 1.6);

  /* Track the stage width so the folder scales with it */
  useIso(() => {
    const el = stageRef.current;
    if (!el) return;
    const set = () => setStageW(Math.round(el.clientWidth));
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* GSAP scroll-in animations */
  useIso(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const ctx = gsap.context(() => {
      const trig = { trigger: root.current, start: 'top 65%', once: true };

      /* Text staggers up */
      gsap.from('[data-copy]', {
        y: 50,
        opacity: 0,
        duration: 1.4,
        stagger: 0.25,
        ease: 'power2.out',
        scrollTrigger: trig,
      });

      /* Folder rises from below and settles */
      gsap.from('[data-folder]', {
        y: 150,
        opacity: 0,
        duration: 1.8,
        delay: 0.4,
        ease: 'power2.out',
        scrollTrigger: trig,
      });
    }, root);

    return () => ctx.revert();
  }, []);

  /* Size the folder to the stage width (16px gutter each side), capped at a large max */
  const folderW  = Math.max(240, Math.min(stageW - 32, FOLDER_ART.w * 1.6));
  const spread   = folderW * (folderW < 600 ? 0.5 : 0.38);   // wider cloud on phones so pills don't collide
  const lift     = folderW < 600 ? 64 : 100;    // pills fly lower on phones

  return (
    <section ref={root} id="ideas" className={s.wrap} aria-labelledby="ideas-title">

      {/* ── Text block: top-left ─────────────────────────────────────── */}
      <div className={s.inner}>
        <h2 id="ideas-title" data-copy className={s.title}>
          All of our <span className={s.hl}>ideas</span> in one place
        </h2>
        <p data-copy className={s.body}>
          Every idea from interns, volunteers, and fellows — collected,
          upvoted, and acted on in one place.
        </p>
      </div>

      {/* ── Folder: in flow under the text, bleeds into the footer ────── */}
      <div ref={stageRef} className={s.folderStage} data-folder-wrap>
        <div className={s.slot}>
          <div data-folder className={s.folder}>
            <IdeasFolder
              items={IDEAS}
              label="Ideas"
              width={folderW}
              spread={spread}
              lift={lift}
              tilt={10}
            />
          </div>
        </div>
      </div>

    </section>
  );
}
