import Link from 'next/link';
import SiteShell from '../components/site/SiteShell';
import PageHero from '../components/site/PageHero';
import { Arrow } from '../components/site/icons';
import s from '../styles/Site.module.css';

export default function NotFound() {
  return (
    <SiteShell>
      <PageHero eyebrow="Error 404" title="This page wandered *off*." text="The link may be old or mistyped. Head back home, or jump into one of the main sections.">
        <Link href="/" className={s.btn}>Back home <span className={s.arrow}><Arrow /></span></Link>
        <Link href="/dashboard" className={s.btnGhost}>Open dashboard</Link>
      </PageHero>
    </SiteShell>
  );
}
