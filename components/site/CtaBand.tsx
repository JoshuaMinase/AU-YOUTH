import Link from 'next/link';
import SplitHeading from './SplitHeading';
import { Arrow } from './icons';
import s from '../../styles/Site.module.css';

export default function CtaBand({
  title = 'Your *community* is waiting.',
  text = 'Join interns, volunteers and fellows from across the continent. It takes two minutes.',
}: { title?: string; text?: string }) {
  return (
    <section className={s.cta}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/pattern.svg" alt="" aria-hidden="true" loading="lazy" />
      <div>
        <SplitHeading as="h2" text={title} className={s.ctaTitle} />
        <p className={s.ctaText} data-reveal>{text}</p>
      </div>
      <div className={s.heroCtas} data-reveal>
        <Link href="/sign-up" className={s.btn}>Join the Network <span className={s.arrow}><Arrow /></span></Link>
        <Link href="/login" className={s.btnGhost}>Log in</Link>
      </div>
    </section>
  );
}
