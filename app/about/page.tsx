import type { Metadata } from 'next';
import Link from 'next/link';
import SiteShell from '../../components/site/SiteShell';
import PageHero from '../../components/site/PageHero';
import SplitHeading from '../../components/site/SplitHeading';
import CtaBand from '../../components/site/CtaBand';
import { Arrow } from '../../components/site/icons';
import s from '../../styles/Site.module.css';

export const metadata: Metadata = { title: 'About' };

const VALUES = [
  { n: '01', t: 'Connect', d: 'Meet peers across departments, cohorts and countries — and keep in touch after your placement ends.', c: s.c_teal, img: 'health', href: '/community' },
  { n: '02', t: 'Learn', d: 'Mentorship, peer circles and skills tracks that turn ambition into real, usable experience.', c: s.c_amber, img: 'impact', href: '/opportunities' },
  { n: '03', t: 'Share', d: 'Post ideas, research and reflections where the whole network — and the Union — can see them.', c: s.c_plum, img: 'growth', href: '/why-join' },
  { n: '04', t: 'Contribute', d: 'Shape continental policy through youth consultations, working groups and the ideas board.', c: s.c_sky, img: 'wellbeing', href: '/sign-up' },
];

const STATS = [
  { n: '55', l: 'AU member states the network welcomes' },
  { n: '3', l: 'Pathways: internships, fellowships, volunteering' },
  { n: '8+', l: 'Departments and organs taking part' },
  { n: '1', l: 'Shared digital home for every cohort' },
];

const STEPS = [
  { t: 'Create your profile', d: 'Tell us your department, skills and interests so coordinators can find you.' },
  { t: 'Join a circle', d: 'Pick peer circles around the topics you care about — policy, tech, health, climate and more.' },
  { t: 'Find opportunities', d: 'Browse internships, fellowships and volunteer roles, and save the ones that fit.' },
  { t: 'Contribute ideas', d: 'Share proposals and research on the ideas board and see them picked up.' },
];

export default function AboutPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="About us"
        title="A shared home for *Africa’s* next leaders."
        text="The AU Youth Community brings together the interns, volunteers and fellows who serve the African Union — one place to connect, learn and contribute."
      >
        <Link href="/sign-up" className={s.btn}>Join the Network <span className={s.arrow}><Arrow /></span></Link>
        <Link href="/opportunities" className={s.btnGhost}>See opportunities</Link>
      </PageHero>

      {/* Mission */}
      <section className={`${s.section} ${s.sectionTint}`}>
        <div className={`${s.container} ${s.split}`}>
          <div className={s.splitImg} data-reveal>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/card-img-3.webp" alt="Young professionals working together" loading="lazy" />
            <p className={s.splitBadge}>Built by and for young people serving the Union.</p>
          </div>
          <div>
            <span className={s.eyebrow} data-reveal>Our mission</span>
            <SplitHeading as="h2" className={s.h2} text="Every placement should open a *network*, not just a desk." />
            <p className={s.lead} style={{ marginTop: 24 }} data-reveal>
              Thousands of young Africans pass through AU institutions every year. Too often, the
              connections and knowledge they build leave with them.
            </p>
            <p className={s.lead} data-reveal>
              We are changing that with a single community where every cohort can find each other,
              share what they learn and keep contributing long after their placement.
            </p>
            <ul className={s.checks}>
              <li data-reveal>Open to interns, volunteers and fellows across all AU organs</li>
              <li data-reveal>Peer-led circles, mentorship and skills tracks</li>
              <li data-reveal>A direct line from youth ideas to the people who act on them</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className={s.section}>
        <div className={s.container}>
          <div className={s.head}>
            <div>
              <span className={s.eyebrow} data-reveal>What we stand for</span>
              <SplitHeading as="h2" className={s.h2} text="Four things we *do* together." />
            </div>
            <p className={s.lead} data-reveal>Each one is a door into the community — pick the one that fits where you are today.</p>
          </div>
          <div className={s.colorGrid}>
            {VALUES.map((v) => (
              <Link key={v.t} href={v.href} className={`${s.colorCard} ${v.c}`} data-reveal>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/assets/card-${v.img}.svg`} alt="" aria-hidden="true" loading="lazy" />
                <span className={s.colorNum}>{v.n}</span>
                <div>
                  <h3 className={s.colorTitle}>{v.t}</h3>
                  <p className={s.colorText}>{v.d}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={s.stats} aria-label="The network in numbers">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/SVG/Asset%201the%20pattern.svg" alt="" aria-hidden="true" loading="lazy" />
        <div className={s.statsGrid}>
          {STATS.map((st) => (
            <div key={st.l} className={s.stat} data-reveal>
              <span className={s.statNum}>{st.n}</span>
              <span className={s.statLabel}>{st.l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className={s.section}>
        <div className={s.container}>
          <div className={s.head}>
            <div>
              <span className={s.eyebrow} data-reveal>How it works</span>
              <SplitHeading as="h2" className={s.h2} text="From first day to *lifelong* network." />
            </div>
          </div>
          <ol className={s.steps} style={{ listStyle: 'none', padding: 0 }}>
            {STEPS.map((st, i) => (
              <li key={st.t} className={s.step} data-reveal>
                <span className={s.stepNum}>{String(i + 1).padStart(2, '0')}</span>
                <h3 className={s.stepTitle}>{st.t}</h3>
                <p className={s.stepText}>{st.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CtaBand />
    </SiteShell>
  );
}
