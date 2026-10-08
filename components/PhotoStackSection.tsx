'use client';
import { useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { STACK_CARDS } from './stackConfig';
import { useIso } from '../lib/hooks';
import s from '../styles/PhotoStack.module.css';

gsap.registerPlugin(ScrollTrigger);

/* Card content — just text, no widgets or chips */
const CARD_CONTENT = [
  { num: '01', subtitle: 'A growing community of young Africans', text: 'Interns, volunteers and fellows from across the continent — connecting, learning and building together.', cta: 'Join the network', href: '/sign-up' },
  { num: '02', subtitle: 'Learn by doing, together', text: 'Hands-on tracks and mentorship that turn ambition into real, usable skills.', cta: 'Explore programs', href: '/opportunities' },
  { num: '03', subtitle: 'Stronger together, across borders', text: 'Peer circles, mentors and partners — a network that opens doors for every member.', cta: 'Meet the community', href: '/community' },
  { num: '04', subtitle: 'Opportunities that keep rising', text: 'Fellowships, internships and volunteer roles that move your journey forward.', cta: 'See opportunities', href: '/opportunities' },
];

const Arrow = () => (
  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
    <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function PhotoStackSection() {
  const rootRef = useRef<HTMLDivElement>(null);

  useIso(() => {
    const root = rootRef.current;
    if (!root) return;

    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const els = gsap.utils.toArray<HTMLElement>('[data-card]', root);
      const N = els.length;
      // MOVE: how long each individual box takes to fill completely (slow animation)
      // HOLD: pause after each box is fully filled before next can start
      // TAIL: final hold after last box
      // Each box gets its own slow, complete animation phase
      const MOVE = 1.8, HOLD = 0.3, TAIL = 1.0;
      const total = HOLD + (N - 1) * (MOVE + HOLD) + TAIL;
      // 1.2 multiplier gives enough scroll distance for controlled, individual box fills
      // Viewport height, ignoring the phone address bar showing/hiding (a ~60–120px height-only
      // resize). Re-measuring on that made the page jump mid-scroll on mobile.
      let vh = window.innerHeight, vw = window.innerWidth;
      const scrollDist = () => Math.round(vh * total * 1.2);

      // Spacer height = scroll distance + one viewport for the sticky stage
      const setSpacer = () => { root.style.height = `${scrollDist() + vh}px`; };
      const onResize = () => {
        if (window.innerWidth === vw && Math.abs(window.innerHeight - vh) < 150) return;
        vw = window.innerWidth; vh = window.innerHeight;
        setSpacer();
      };
      setSpacer();
      window.addEventListener('resize', onResize);

      // Park cards 2..N below the screen
      gsap.set(els.slice(1), { yPercent: 100 });
      root.setAttribute('data-ready', '1');

      const tl = gsap.timeline({ defaults: { ease: 'none' } });

      els.forEach((card, i) => {
        const lines = card.querySelectorAll('.s4-line');
        const rest  = card.querySelectorAll('.s4-reveal');

        const T = i === 0 ? 0 : HOLD + (i - 1) * (MOVE + HOLD);

        if (i === 0) {
          // First card: content plays on entering viewport - slow reveal
          gsap.fromTo(lines, { yPercent: 115 }, { yPercent: 0, duration: 1.5, ease: 'power2.out', stagger: 0.15, scrollTrigger: { trigger: root, start: 'top 70%', once: true } });
          gsap.fromTo(rest, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.3, ease: 'power2.out', stagger: 0.12, delay: 0.3, scrollTrigger: { trigger: root, start: 'top 70%', once: true } });
        } else {
          const prev = els[i - 1];
          const prevShade = prev.querySelector('.s4-shade');
          const dir = i % 2 ? 1 : -1;

          // Each box gets its own slow, complete animation phase
          // Incoming card rises from below - slow and controlled
          tl.to(card, { yPercent: 0, duration: MOVE, ease: 'power2.inOut' }, T);
          // Previous card tilts back and recedes - slow and controlled
          tl.to(prev, { yPercent: -14, rotation: 5 * dir, scale: 0.84, duration: MOVE, ease: 'power2.inOut', transformOrigin: '50% 100%' }, T);
          tl.to(prevShade, { opacity: 0.55, duration: MOVE, ease: 'power2.inOut' }, T);

          // Text content unfolds gradually as box fills
          tl.fromTo(lines, { yPercent: 115 }, { yPercent: 0, duration: MOVE * 0.6, ease: 'power2.out', stagger: 0.12 }, T + MOVE * 0.25);
          tl.fromTo(rest, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: MOVE * 0.6, ease: 'power2.out', stagger: 0.15 }, T + MOVE * 0.35);
        }
      });

      // Pad the timeline by TAIL units so the last card has time to fully settle
      // before scrub catches up and the pin releases. Without this GSAP clips the
      // duration and the last card jumps/skips.
      tl.to({}, { duration: TAIL });

      // Link the timeline to scroll — sticky stage handles positioning
      const st = ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: () => '+=' + scrollDist(),
        animation: tl,
        scrub: 1,            // Lenis already smooths the wheel; a long scrub on top feels laggy
        invalidateOnRefresh: true,
      });

      // the spacer just changed height: re-measure every trigger below this section
      ScrollTrigger.refresh();
      document.fonts?.ready.then(() => ScrollTrigger.refresh());

      return () => {
        root.removeAttribute('data-ready');
        root.style.height = '';
        window.removeEventListener('resize', onResize);
        st.kill();
        tl.kill();
      };
    });

    mm.add('(prefers-reduced-motion: reduce)', () => {
      root.classList.add('s4-static');
      return () => root.classList.remove('s4-static');
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={rootRef} className={s.spacer} aria-label="Our community">
      <div data-stage className={s.stage}>
        {STACK_CARDS.map((c, k) => {
          const content = CARD_CONTENT[k];
          return (
            <article key={c.id} data-card className={s.card} aria-label={c.label}
              style={{ zIndex: k + 2 }} data-card-type={c.id}>
              {/* SVG pattern layer — covers the full card edge-to-edge */}
              <img
                className={s.cardPattern}
                src={`/assets/card-${c.id}.svg`}
                alt=""
                aria-hidden="true"
                draggable={false}
              />
              <div className="s4-shade" />
              <div className="s4-inner">
                <div className="s4-left">
                  <h2 className="s4-title">
                    <span className="s4-mask"><span className="s4-line">{c.label}</span></span>
                  </h2>
                  <div className="s4-bottom">
                    <span className="s4-num s4-reveal">{content.num}</span>
                    <div className="s4-copy">
                      <p className="s4-sub s4-reveal">{content.subtitle}</p>
                      <p className="s4-text s4-reveal">{content.text}</p>
                      <Link className="s4-cta s4-reveal" href={content.href}>
                        <span>{content.cta}</span>
                        <span className="s4-cta-arrow"><Arrow /></span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
