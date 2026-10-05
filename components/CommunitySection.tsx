'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from '../styles/CommunitySection.module.css';

gsap.registerPlugin(ScrollTrigger);

/* ── Prop types ──────────────────────────────────────────────────────── */
interface CtaProps {
  label: string;
  href: string;
}

interface CommunitySectionProps {
  heading?: string;
  body?: string[];
  primaryCta?: CtaProps;
  secondaryCta?: CtaProps;
  imageSrc?: string;
}

/* ── Default copy (matches the design) ──────────────────────────────── */
const DEFAULT_HEADING =
  'Be Part of Something Larger Than Yourself';

const DEFAULT_BODY = [
  'The AU Youth Community is a shared space for young professionals, interns, fellows, and emerging leaders from across the African continent.',
  'Here, you can connect with peers who share your drive, learn from a community that understands your journey, and contribute your voice to conversations that matter. Whether you\u2019re just starting out or stepping into leadership \u2014 this community is built for you.',
];

/* ── Component ───────────────────────────────────────────────────────── */
export default function CommunitySection({
  heading = DEFAULT_HEADING,
  body = DEFAULT_BODY,
  primaryCta = { label: 'Become a Member', href: '#' },
  secondaryCta = { label: 'Learn More', href: '#' },
  imageSrc = '/assets/community-illustration.png',
}: CommunitySectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const illustrationRef = useRef<HTMLDivElement>(null);
  const contentItemsRef = useRef<(HTMLElement | null)[]>([]);

  /* helper to collect animated content children */
  const setContentRef = (el: HTMLElement | null, i: number) => {
    contentItemsRef.current[i] = el;
  };

  useEffect(() => {
    const section = sectionRef.current;
    const illustration = illustrationRef.current;
    const items = contentItemsRef.current.filter(Boolean) as HTMLElement[];

    if (!section || !illustration || items.length === 0) return;

    /* honour reduced-motion */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      /* Illustration slides in from the left */
      gsap.from(illustration, {
        x: -60,
        opacity: 0,
        duration: 1.0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 95%',
          toggleActions: 'play none none none',
        },
      });

      /* Heading / paragraphs / button row stagger up */
      gsap.from(items, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      aria-labelledby="join-heading"
    >
      {/* ── LEFT: illustration bleeds off bottom-left ─────────────────── */}
      <div ref={illustrationRef} className={styles.illustrationWrap}>
        <Image
          src={imageSrc}
          alt="Illustration of a diverse group of young African professionals looking toward the future"
          fill
          sizes="(max-width: 768px) 100vw, 55vw"
          className={styles.illustration}
          priority={false}
        />
      </div>

      {/* ── RIGHT: text column ────────────────────────────────────────── */}
      <div className={styles.textCol}>
        <h2
          id="join-heading"
          className={styles.heading}
          ref={(el) => setContentRef(el, 0)}
        >
          {heading}
        </h2>

        {body.map((para, i) => (
          <p
            key={i}
            className={styles.body}
            ref={(el) => setContentRef(el, i + 1)}
          >
            {para}
          </p>
        ))}

        <div
          className={styles.ctas}
          ref={(el) => setContentRef(el, body.length + 1)}
        >
          <Link href={primaryCta.href} className={styles.btnPrimary}>
            {primaryCta.label}
          </Link>
          <Link href={secondaryCta.href} className={styles.btnSecondary}>
            {secondaryCta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
