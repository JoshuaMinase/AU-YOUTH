import type { ElementType, ReactNode } from 'react';
import s from '../../styles/Site.module.css';

/** Heading whose words slide up out of a mask on mount (animated by useReveal via [data-w]).
 *  Wrap a word in *asterisks* to highlight it. */
export default function SplitHeading({ text, as: Tag = 'h1', className }: { text: string; as?: ElementType; className?: string }) {
  const parts: ReactNode[] = [];
  text.split(' ').forEach((w, i) => {
    const hl = /^\*.*\*[.,!?]?$/.test(w);
    const clean = w.replace(/\*/g, '');
    if (i) parts.push(' ');
    parts.push(
      <span key={i} className={s.mask}>
        <span data-w className={s.word}>{hl ? <em>{clean}</em> : clean}</span>
      </span>,
    );
  });
  return <Tag className={className} aria-label={text.replace(/\*/g, '')}>{parts}</Tag>;
}
