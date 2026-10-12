import type { ReactNode } from 'react';
import Link from 'next/link';
import SiteShell from './SiteShell';
import { LEGAL, LEGAL_LINKS } from '../../lib/legal';
import site from '../../styles/Site.module.css';
import s from '../../styles/Legal.module.css';

export interface LegalSection { id: string; title: string; body: ReactNode }

/** Shared layout for the legal pages: green header, table of contents, numbered sections, links to the other legal pages. */
export default function LegalPage({ eyebrow, title, intro, sections, current }: {
  eyebrow: string; title: string; intro: ReactNode; sections: LegalSection[]; current: string;
}) {
  return (
    <SiteShell>
      <header className={s.head}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.headPattern} src="/assets/pattern.svg" alt="" aria-hidden="true" />
        <div className={s.headInner}>
          <span className={site.heroEyebrow}>{eyebrow}</span>
          <h1 className={s.title}>{title}</h1>
          <p className={s.updated}>Last updated {LEGAL.updated}</p>
        </div>
      </header>

      <section className={s.body}>
        <div className={s.layout}>
          <nav className={s.toc} aria-label="On this page">
            <p className={s.tocTitle}>On this page</p>
            <ol>
              {sections.map((x, i) => <li key={x.id}><a href={`#${x.id}`}>{i + 1}. {x.title}</a></li>)}
            </ol>
          </nav>

          <article className={s.prose}>
            <div className={s.intro}>{intro}</div>
            {sections.map((x, i) => (
              <section key={x.id} id={x.id} className={s.sec}>
                <h2>{i + 1}. {x.title}</h2>
                {x.body}
              </section>
            ))}
            <p className={s.note}>
              Questions about this page? Email <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
            </p>
            <ul className={s.others} aria-label="Other legal pages">
              {LEGAL_LINKS.filter(([, h]) => h !== current).map(([t, h]) => <li key={h}><Link href={h}>{t}</Link></li>)}
            </ul>
          </article>
        </div>
      </section>
    </SiteShell>
  );
}
