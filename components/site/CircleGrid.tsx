'use client';
import { useState } from 'react';
import s from '../../styles/Site.module.css';

const CIRCLES = [
  { t: 'Policy & Governance', d: 'Draft briefs, review frameworks and debate the ideas shaping the Union.', c: '#032210', n: 412 },
  { t: 'Tech & Innovation', d: 'Builders working on digital public goods, data and AI for the continent.', c: '#0072C6', n: 356 },
  { t: 'Health & Well-being', d: 'Public health, mental health and care — for communities and for ourselves.', c: '#218380', n: 241 },
  { t: 'Climate & Agriculture', d: 'Food systems, resilience and the green transition, from field to policy.', c: '#117302', n: 288 },
  { t: 'Peace & Security', d: 'Conflict prevention, mediation and the youth, peace & security agenda.', c: '#8F2D56', n: 197 },
  { t: 'Arts & Culture', d: 'Storytellers, designers and creatives celebrating African heritage.', c: '#d68b17', n: 173 },
];

export default function CircleGrid() {
  const [joined, setJoined] = useState<string[]>([]);
  return (
    <div className={s.circles}>
      {CIRCLES.map((c) => {
        const on = joined.includes(c.t);
        return (
          <article key={c.t} className={s.circle} data-reveal>
            <div className={s.circleTop}>
              <span className={s.circleDot} style={{ background: c.c }} aria-hidden="true">{c.t[0]}</span>
              <span className={s.circleCount}>{(c.n + (on ? 1 : 0)).toLocaleString()} members</span>
            </div>
            <h3 className={s.circleTitle}>{c.t}</h3>
            <p className={s.circleText}>{c.d}</p>
            <button type="button" className={s.circleBtn} aria-pressed={on}
              onClick={() => setJoined((p) => (on ? p.filter((x) => x !== c.t) : [...p, c.t]))}>
              {on ? '✓ Joined' : '+ Join circle'}
            </button>
          </article>
        );
      })}
    </div>
  );
}
