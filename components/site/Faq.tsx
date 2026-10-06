'use client';
import { useState } from 'react';
import s from '../../styles/Site.module.css';

export default function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState(0);
  return (
    <div className={s.faq}>
      {items.map((it, i) => (
        <div key={it.q} className={s.faqItem} data-open={open === i ? '' : undefined} data-reveal>
          <button type="button" className={s.faqQ} aria-expanded={open === i} aria-controls={`faq-${i}`}
            onClick={() => setOpen(open === i ? -1 : i)}>
            {it.q}<span className={s.faqIcon} aria-hidden="true" />
          </button>
          <div id={`faq-${i}`} className={s.faqA} role="region"><div><p>{it.a}</p></div></div>
        </div>
      ))}
    </div>
  );
}
