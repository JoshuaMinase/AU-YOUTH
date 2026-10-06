import type { Metadata } from 'next';
import Link from 'next/link';
import SiteShell from '../../components/site/SiteShell';
import PageHero from '../../components/site/PageHero';
import SplitHeading from '../../components/site/SplitHeading';
import CtaBand from '../../components/site/CtaBand';
import OpportunityBoard from '../../components/site/OpportunityBoard';
import { Arrow } from '../../components/site/icons';
import s from '../../styles/Site.module.css';

export const metadata: Metadata = { title: 'Opportunities' };

export default function OpportunitiesPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Opportunities"
        title="Find the role that *moves* you forward."
        text="Internships, fellowships, volunteer placements and events from across the African Union — in one place, updated by the departments themselves."
      >
        <a href="#board" className={s.btn}>Browse roles <span className={s.arrow}><Arrow /></span></a>
        <Link href="/sign-up" className={s.btnGhost}>Get alerts</Link>
      </PageHero>

      <section id="board" className={`${s.section} ${s.sectionTint}`}>
        <div className={s.container}>
          <div className={s.head}>
            <div>
              <span className={s.eyebrow} data-reveal>Open now</span>
              <SplitHeading as="h2" className={s.h2} text="Opportunities that keep *rising*." />
            </div>
            <p className={s.lead} data-reveal>
              Filter by type, search by place or topic, and save the ones you want to come back to.
              Applying takes you to your network account.
            </p>
          </div>
          <OpportunityBoard />
        </div>
      </section>

      <CtaBand title="Never miss a *deadline*." text="Members get new opportunities matched to their profile, straight to their dashboard." />
    </SiteShell>
  );
}
