import Link from 'next/link';
import SiteShell from '../components/site/SiteShell';
import PageHero from '../components/site/PageHero';
import PageCatcher from '../components/site/PageCatcher';
import { Arrow } from '../components/site/icons';
import s from '../styles/Site.module.css';

export default function NotFound() {
  return (
    <SiteShell>
      <PageHero eyebrow="Error 404" title="This page wandered *off*." text="The link may be old or mistyped. Head back home, or jump into one of the main sections.">
        <Link href="/" className={s.btn}>Back home <span className={s.arrow}><Arrow /></span></Link>
        <Link href="/dashboard" className={s.btnGhost}>Open dashboard</Link>
      </PageHero>
      <section className={`${s.section} ${s.sectionTint}`}>
        <div className={s.container}>
          <div className={s.headCenter}>
            <span className={s.eyebrow} data-reveal>While you are here</span>
            <h2 className={s.h2} data-reveal>Catch the <em>lost</em> pages.</h2>
            <p className={`${s.lead}`} data-reveal>Pages keep slipping out of the site. Slide the basket and catch as many as you can.</p>
          </div>
          <PageCatcher />
        </div>
      </section>
    </SiteShell>
  );
}
