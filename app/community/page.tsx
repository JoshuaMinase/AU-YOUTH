import type { Metadata } from 'next';
import Link from 'next/link';
import SiteShell from '../../components/site/SiteShell';
import PageHero from '../../components/site/PageHero';
import SplitHeading from '../../components/site/SplitHeading';
import CtaBand from '../../components/site/CtaBand';
import CircleGrid from '../../components/site/CircleGrid';
import { Arrow } from '../../components/site/icons';
import s from '../../styles/Site.module.css';

export const metadata: Metadata = { title: 'Our Community' };

const PHOTOS = [
  { src: '/assets/card-img-1.webp', cap: 'Onboarding week' },
  { src: '/assets/card-img-2.webp', cap: 'Policy circles' },
  { src: '/assets/card-img-3.webp', cap: 'Skills workshops' },
  { src: '/assets/card-img-4.webp', cap: 'Youth Innovation Exchange' },
];

const VOICES = [
  { q: 'I arrived not knowing anyone in Addis. Within a week my circle had become my people.', n: 'Amara Mensah', r: 'Intern · HRST', i: 'AM' },
  { q: 'The mentorship track helped me turn a research idea into a brief my department actually used.', n: 'Fatima Osei', r: 'Fellow · Peace & Security', i: 'FO' },
  { q: 'Volunteering felt bigger once I could see everyone else doing the same work across the continent.', n: 'Kofi Boateng', r: 'Volunteer · Economic Affairs', i: 'KB' },
];

export default function CommunityPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Our community"
        title="Stronger *together*, across borders."
        text="Peer circles, mentors and partners — a network of interns, volunteers and fellows that opens doors for every member."
      >
        <Link href="/sign-up" className={s.btn}>Become a member <span className={s.arrow}><Arrow /></span></Link>
        <a href="#circles" className={s.btnGhost}>Explore circles</a>
      </PageHero>

      {/* Photos */}
      <section className={`${s.section} ${s.sectionTint}`}>
        <div className={s.container}>
          <div className={s.head}>
            <div>
              <span className={s.eyebrow} data-reveal>Life in the network</span>
              <SplitHeading as="h2" className={s.h2} text="Moments from across the *Union*." />
            </div>
            <p className={s.lead} data-reveal>From onboarding week to summit stages, members meet, learn and build together — online and in person.</p>
          </div>
          <div className={s.mosaic}>
            {PHOTOS.map((p) => (
              <figure key={p.cap} data-reveal>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt={p.cap} loading="lazy" />
                <figcaption>{p.cap}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Circles */}
      <section id="circles" className={s.section}>
        <div className={s.container}>
          <div className={s.head}>
            <div>
              <span className={s.eyebrow} data-reveal>Peer circles</span>
              <SplitHeading as="h2" className={s.h2} text="Find your *circle*." />
            </div>
            <p className={s.lead} data-reveal>Circles are small, member-led groups built around a shared interest. Join as many as you like.</p>
          </div>
          <CircleGrid />
        </div>
      </section>

      {/* Voices */}
      <section className={`${s.section} ${s.sectionTint}`}>
        <div className={s.container}>
          <div className={s.headCenter}>
            <span className={s.eyebrow} data-reveal>Member voices</span>
            <SplitHeading as="h2" className={s.h2} text="In their own *words*." />
          </div>
          <div className={s.quotes}>
            {VOICES.map((v) => (
              <figure key={v.n} className={s.quote} data-reveal style={{ margin: 0 }}>
                <blockquote>{v.q}</blockquote>
                <figcaption className={s.who}>
                  <span className={s.whoAv}>{v.i}</span>
                  <span><span className={s.whoName}>{v.n}</span><br /><span className={s.whoRole}>{v.r}</span></span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </SiteShell>
  );
}
