import type { Metadata } from 'next';
import Link from 'next/link';
import SiteShell from '../../components/site/SiteShell';
import PageHero from '../../components/site/PageHero';
import SplitHeading from '../../components/site/SplitHeading';
import CtaBand from '../../components/site/CtaBand';
import Faq from '../../components/site/Faq';
import { Arrow } from '../../components/site/icons';
import s from '../../styles/Site.module.css';

export const metadata: Metadata = { title: 'Why Join' };

const BENEFITS = [
  { n: '01', t: 'Belong', d: 'A growing community of young Africans — interns, volunteers and fellows connecting, learning and building together.', bg: '#218380', img: 'health' },
  { n: '02', t: 'Grow', d: 'Hands-on tracks, mentorship and peer review that turn ambition into real, usable skills you can show.', bg: '#FBB13C', img: 'impact', dark: true },
  { n: '03', t: 'Be heard', d: 'Your ideas go on the shared board, get upvoted, and reach the departments that can act on them.', bg: '#8F2D56', img: 'growth' },
  { n: '04', t: 'Go further', d: 'Fellowships, internships and volunteer roles matched to your profile — so your journey keeps moving.', bg: '#73D2DE', img: 'wellbeing', dark: true },
];

const FAQS = [
  { q: 'Who can join the AU Youth Community?', a: 'Current and former interns, volunteers and fellows of the African Union Commission and its organs. If you are applying for a placement, you can create an account and join once you are confirmed.' },
  { q: 'Does it cost anything?', a: 'No. Membership is free for everyone serving, or who has served, with the Union.' },
  { q: 'What happens when my placement ends?', a: 'You keep your account and your connections. Alumni can mentor new cohorts, stay in their circles and keep receiving opportunities.' },
  { q: 'How are my ideas used?', a: 'Ideas posted on the board are reviewed every quarter by youth focal points in each department. Popular ideas are shared with the relevant teams and you are notified of any follow-up.' },
  { q: 'Is my information private?', a: 'Your profile is only visible to signed-in members. You control which details are shown, and you can delete your account at any time.' },
];

export default function WhyJoinPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Why join"
        title="Connect. Learn. *Contribute.*"
        text="Your placement is a chapter. The network is what you carry with you — the people, the skills and a voice in the Union’s future."
      >
        <Link href="/sign-up" className={s.btn}>Join the Network <span className={s.arrow}><Arrow /></span></Link>
        <a href="#faq" className={s.btnGhost}>Read the FAQ</a>
      </PageHero>

      <section className={`${s.section} ${s.sectionTint}`}>
        <div className={s.container}>
          <div className={s.head}>
            <div>
              <span className={s.eyebrow} data-reveal>What you get</span>
              <SplitHeading as="h2" className={s.h2} text="Four reasons members *stay*." />
            </div>
            <p className={s.lead} data-reveal>Built around what interns, volunteers and fellows told us they were missing.</p>
          </div>
          <div className={s.benefits}>
            {BENEFITS.map((b) => (
              <article key={b.n} className={s.benefit} style={{ background: b.bg, color: b.dark ? '#032210' : '#fff' }} data-reveal>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/assets/card-${b.img}.svg`} alt="" aria-hidden="true" loading="lazy" />
                <span className={s.benefitNum}>{b.n}</span>
                <h3 className={s.benefitTitle}>{b.t}</h3>
                <p className={s.benefitText}>{b.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className={s.section}>
        <div className={s.container}>
          <div className={s.headCenter}>
            <span className={s.eyebrow} data-reveal>Questions</span>
            <SplitHeading as="h2" className={s.h2} text="Good to *know*." />
          </div>
          <Faq items={FAQS} />
        </div>
      </section>

      <CtaBand />
    </SiteShell>
  );
}
