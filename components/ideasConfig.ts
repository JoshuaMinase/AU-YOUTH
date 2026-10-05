/** Section 4 — "All of our ideas in one place". Edit the pills here. */
export const FOLDER_ART = { w: 553.32, h: 404.32 };          // folder svg viewBox (design px)
export const PAPER = { x: 57.4, y: 47.42, w: 429.28, h: 282.03, r: 23 };   // white sheet inside the folder

export const IDEAS = [
  { label: 'Intern spotlight',      value: 'intern-spotlight',  color: '#C9AB5C' },
  { label: "Fellows' research",     value: 'fellows-research',  color: '#117302' },
  { label: 'Skills swap',           value: 'skills-swap',       color: '#FCD116' },
  { label: 'Mentorship circles',    value: 'mentorship',        color: '#0072C6' },
  { label: 'Youth policy brief',    value: 'policy-brief',      color: '#C9AB5C' },
] as const;
