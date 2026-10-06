import type { ReactNode } from 'react';
import SplitHeading from './SplitHeading';
import s from '../../styles/Site.module.css';

export default function PageHero({ eyebrow, title, text, children }: { eyebrow: string; title: string; text: string; children?: ReactNode }) {
  return (
    <section className={s.hero}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img data-hero-pattern className={s.heroPattern} src="/assets/pattern.svg" alt="" aria-hidden="true" />
      <div className={s.heroInner}>
        <div>
          <span className={s.heroEyebrow} data-reveal>{eyebrow}</span>
          <SplitHeading text={title} className={s.heroTitle} />
        </div>
        <div>
          <p className={s.heroText} data-reveal>{text}</p>
          {children && <div className={s.heroCtas} data-reveal>{children}</div>}
        </div>
      </div>
    </section>
  );
}
