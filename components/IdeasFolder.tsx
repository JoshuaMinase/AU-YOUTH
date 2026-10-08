'use client';
/**
 * IdeasFolder — React port of "Folder Float" (vue-bits) using the AU Youth folder artwork.
 * Layers (bottom -> top): back panel · pills anchor · paper · front flap · click target.
 * Pills fly out of the folder on hover/click in a simple CSS animation.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { FOLDER_ART, PAPER } from './ideasConfig';
import s from '../styles/IdeasFolder.module.css';

const useIso = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export type FolderItem = { label: string; value: string; color?: string };
type Size = { w: number; h: number };

export interface IdeasFolderProps {
  items: readonly FolderItem[];
  label?: string;
  sublabel?: string;
  /** rendered folder width in px (height follows the artwork's aspect ratio) */
  width?: number;
  trigger?: 'hover' | 'click';
  closeOnSelect?: boolean;
  spread?: number;   // half the widest the cloud may be (px)
  lift?: number;     // gap between the folder mouth and the lowest row (px)
  tilt?: number;     // max lean of a pill (deg)
  flapAngle?: number;
  openDuration?: number;
  stagger?: number;
  onSelect?: (value: string, index: number) => void;
  onOpenChange?: (open: boolean) => void;
}

const PAD = 34, CHAR = 7.2, GAP = 36, ROW = 62;
const jitter = (i: number) => { const x = Math.sin(i * 12.9898 + 4.1414) * 43758.5453; return x - Math.floor(x); };
const jitter2 = (i: number) => { const x = Math.sin(i * 78.233 + 1.7) * 43758.5453; return x - Math.floor(x); };

/** place pills in a loose grid of slots, nudged randomly — no overlap, natural look */
const layout = (list: readonly FolderItem[], spread: number, lift: number, tilt: number, sizes: (Size | null)[]) => {
  const n = list.length;
  const pos: { x: number; y: number; r: number }[] = [];

  // Divide into 2 rows: top row gets ceil(n/2), bottom row gets floor(n/2)
  const topCount = Math.ceil(n / 2);
  const botCount = n - topCount;

  const placeRow = (count: number, yBase: number, rowIndex: number) => {
    // evenly space slots across spread, then nudge each ±nudge
    const nudgeX = spread * 0.08;
    const nudgeY = lift * 0.18;
    for (let k = 0; k < count; k++) {
      const i = rowIndex === 0 ? k : topCount + k;
      const j  = jitter(i);
      const j2 = jitter2(i);
      // evenly spaced base x across spread, offset so row is centred
      const t = count > 1 ? k / (count - 1) : 0.5;
      const x = (t - 0.5) * spread * 1.3 + (j - 0.5) * nudgeX;
      const y = yBase + (j2 - 0.5) * nudgeY;
      const r = tilt * (j * 2 - 1) * 0.7;
      pos[i] = { x, y, r };
    }
  };

  placeRow(topCount, -lift - 68, 0);   // top row: higher up
  placeRow(botCount, -lift,      1);   // bottom row: closer to folder

  return pos;
};

export default function IdeasFolder({
  items, label = 'Ideas', sublabel, width = FOLDER_ART.w, trigger = 'hover', closeOnSelect = true,
  spread = 300, lift = 64, tilt = 8, flapAngle = 24,
  openDuration = 520, stagger = 45, onSelect, onOpenChange,
}: IdeasFolderProps) {
  const [open, setOpen] = useState(false);
  const [popped, setPopped] = useState(-1);
  const [sizes, setSizes] = useState<Size[]>([]);
  const anchor = useRef<HTMLDivElement>(null);
  const pills = useRef<(HTMLButtonElement | null)[]>([]);
  const timers = useRef<{ pop?: ReturnType<typeof setTimeout> }>({});
  const n = items.length;
  const k = Math.min(1, Math.max(0.7, width / FOLDER_ART.w));     // pill scale on small screens
  const height = (width * FOLDER_ART.h) / FOLDER_ART.w;

  const pos = useMemo(() => layout(items, spread, lift, tilt, sizes), [items, spread, lift, tilt, sizes]);

  /* ---- measure pill widths so rows pack exactly ---- */
  const measure = () => {
    const next = pills.current.slice(0, n).map((el) => (el ? { w: el.offsetWidth, h: el.offsetHeight } : null));
    if (next.some((v) => !v)) return;
    const sz = next as Size[];
    setSizes((prev) => (prev.length === sz.length && prev.every((p, i) => p.w === sz[i].w && p.h === sz[i].h) ? prev : sz));
  };

  /* --x / --y are written by hand so React doesn't fight over them */
  const applyLayout = () => {
    pos.forEach((p, i) => {
      const el = pills.current[i]; if (!el) return;
      el.style.setProperty('--x', `${p.x.toFixed(1)}px`);
      el.style.setProperty('--y', `${p.y.toFixed(1)}px`);
    });
  };

  const set = (next: boolean) => {
    setOpen((cur) => { if (cur !== next) onOpenChange?.(next); return next; });
  };

  useIso(() => { measure(); document.fonts?.ready.then(measure); }, [n, width]);
  useIso(() => { applyLayout(); }, [pos]);

  useEffect(() => () => { clearTimeout(timers.current.pop); }, []);

  /* ---- interaction ---- */
  const pick = (item: FolderItem, i: number) => {
    onSelect?.(item.value, i);
    clearTimeout(timers.current.pop); setPopped(i);
    timers.current.pop = setTimeout(() => setPopped(-1), 320);
    if (closeOnSelect) set(false);
  };

  const hover = trigger === 'hover';
  const vars = {
    '--w': `${width}px`, '--h': `${height}px`, '--k': k,
    '--spread': `${spread}px`, '--lift': `${lift}px`,
    '--angle': `${flapAngle}deg`, '--open': `${openDuration}ms`, '--close': `${Math.round(openDuration * 0.6)}ms`,
    '--stagger': `${stagger}ms`, '--n': n,
    '--anchor-top': `${(PAPER.y / FOLDER_ART.h) * 100}%`,
    '--paper-l': `${(PAPER.x / FOLDER_ART.w) * 100}%`, '--paper-t': `${(PAPER.y / FOLDER_ART.h) * 100}%`,
    '--paper-w': `${(PAPER.w / FOLDER_ART.w) * 100}%`, '--paper-h': `${(PAPER.h / FOLDER_ART.h) * 100}%`,
    '--paper-r': `${(PAPER.r / FOLDER_ART.w) * width}px`,
  } as CSSProperties;
  const sub = sublabel ?? `${n} ideas`;

  return (
    <div
      className={s.root} style={vars}
      data-open={open ? '' : undefined}
      onPointerEnter={(e) => { if (hover && e.pointerType !== 'touch') set(true); }}
      onPointerLeave={(e) => { if (hover && e.pointerType !== 'touch') set(false); }}
      onKeyDown={(e) => { if (e.key === 'Escape' && open) { e.stopPropagation(); set(false); } }}
    >
      <img className={s.back} src="/assets/folder-back.svg" alt="" draggable={false} />

      <div ref={anchor} className={s.anchor}>
        {items.map((item, i) => (
          <div
            key={`${item.value}-${i}`} className={s.pill}
            ref={(el) => { pills.current[i] = el as any; }}
            tabIndex={-1} aria-hidden="true"
            data-pop={popped === i ? '' : undefined}
            style={{ '--i': i, '--r': `${pos[i]?.r.toFixed(2) ?? 0}deg`, '--dot': item.color ?? '#C9AB5C' } as CSSProperties}
          >
            <span className={s.pillText}><i className={s.dot} />{item.label}</span>
          </div>
        ))}
      </div>

      <span className={s.paper} aria-hidden="true" />
      <img className={s.front} src="/assets/folder-front.svg" alt="" draggable={false} />
      <button type="button" className={s.hit} aria-expanded={open} aria-label={`${label}, ${sub}`} onClick={() => set(!open)} />
    </div>
  );
}
