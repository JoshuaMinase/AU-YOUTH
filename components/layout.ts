import type { CSSProperties } from 'react';
// Canvas: 1440 × 1600. Hero shortened to 820px. Panel starts at 700, taller at 875px.
export const W = 1440, H = 1600, HERO_H = 820, PANEL_Y = 700;
export const SLOT = { w: 283, h: 411 };   // card size in section 2
export const POSE = { w: 339, h: 494 };   // card size in the hero stack
export type Box = { x: number; y: number; w: number; h: number };
/** position an element by its design-space box (1440 x 1600) as % of the stage */
export const box = ({ x, y, w, h }: Box): CSSProperties => ({
  position: 'absolute', left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`,
  width: `${(w / W) * 100}%`, height: `${(h / H) * 100}%`,
});
// hero stack "places" — y=80 pushes the stack up near the nav
export const PLACES = [
  { x: 779, y: 80, z: 1, dim: 0.55 },
  { x: 838, y: 80, z: 2, dim: 0.45 },
  { x: 906, y: 80, z: 4, dim: 0 },
  { x: 987, y: 78, z: 3, dim: 0.35 },
] as const;
export const BASE_AT = [0, 1, 3, 2];   // place index of gold, blue, green, yellow at rest
// `slot` = where each card lands in section 2
export const CARDS = [
  { id: 'gold',   color: '#C9AB5C', label: 'Connect', img: '/assets/card-img-1.jpg', slot: { x: 101,  y: 920 } },
  { id: 'blue',   color: '#0072C6', label: 'AU News', img: '/assets/card-img-2.jpg', slot: { x: 426,  y: 920 } },
  { id: 'green',  color: '#117302', label: 'Share',   img: '/assets/card-img-3.jpg', slot: { x: 742,  y: 920 } },
  { id: 'yellow', color: '#FCD116', label: 'Learn',   img: '/assets/card-img-4.jpg', slot: { x: 1055, y: 920 } },
] as const;
// words typed in a loop
export const WORDS = [
  { key: 'word-connect', n: 8 }, { key: 'word-experience', n: 10 }, { key: 'word-learn', n: 5 },
] as const;
export const WORD_TOP = 323;
export const NAV_LINKS = [
  ['Home', '#top'], ['About', '#about'], ['Opportunities', '#opportunities'],
  ['Our Community', '#community'], ['Why Join', '#join'],
] as const;
