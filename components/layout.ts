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
  { id: 'gold',   color: '#C9AB5C', label: 'Connect', img: '/assets/card-img-1.webp', slot: { x: 101,  y: 920 } },
  { id: 'blue',   color: '#0072C6', label: 'AU News', img: '/assets/card-img-2.webp', slot: { x: 426,  y: 920 } },
  { id: 'green',  color: '#117302', label: 'Share',   img: '/assets/card-img-3.webp', slot: { x: 742,  y: 920 } },
  { id: 'yellow', color: '#FCD116', label: 'Learn',   img: '/assets/card-img-4.webp', slot: { x: 1055, y: 920 } },
] as const;
/* ---------- phone canvas (≤760px): 390 wide, stacked text → card stack → 2×2 grid ----------
   Unlike the desktop canvas it is not stretched vertically: the stage is exactly 390 × M_H. */
export const MOBILE_MQ = '(max-width: 760px)';
export const M_W = 390, M_H = 1384, M_HERO_H = 700, M_PANEL_Y = 680;
export const M_SLOT = { w: 165, h: 238 };
export const M_POSE = { w: 196, h: 283 };
export const M_PLACES = [
  { x: 24,  y: 350, z: 1 },
  { x: 58,  y: 350, z: 2 },
  { x: 97,  y: 350, z: 4 },
  { x: 144, y: 349, z: 3 },
] as const;
export const M_SLOTS = [{ x: 20, y: 852 }, { x: 205, y: 852 }, { x: 20, y: 1106 }, { x: 205, y: 1106 }] as const;
/** phone boxes for the hero copy and section heading (design px on the 390 canvas) */
export const M_BOX = {
  headline:  { x: 20, y: 112, w: 350, h: 50 },
  typing:    { x: 22, y: 166, w: 300, h: 42 },
  paragraph: { x: 20, y: 224, w: 340, h: 100 },
  heading:   { x: 20, y: 724, w: 350, h: 40 },
  sub:       { x: 30, y: 774, w: 330, h: 44 },
} as const;
/** desktop box + phone box → CSS variables read by `.abs` in Landing.module.css */
export const place = (d: Box, m: Box) => ({
  '--l': `${(d.x / W) * 100}%`, '--t': `${(d.y / H) * 100}%`, '--w': `${(d.w / W) * 100}%`, '--h': `${(d.h / H) * 100}%`,
  '--ml': `${(m.x / M_W) * 100}%`, '--mt': `${(m.y / M_H) * 100}%`, '--mw': `${(m.w / M_W) * 100}%`, '--mh': `${(m.h / M_H) * 100}%`,
}) as CSSProperties;
// words typed in a loop
export const WORDS = [
  { key: 'word-connect', n: 8 }, { key: 'word-experience', n: 10 }, { key: 'word-learn', n: 5 },
] as const;
export const WORD_TOP = 323;
export const NAV_LINKS = [
  ['Home', '/'], ['About', '/about'], ['Opportunities', '/opportunities'],
  ['Our Community', '/community'], ['Why Join', '/why-join'],
] as const;
