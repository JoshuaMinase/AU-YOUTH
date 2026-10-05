/**
 * Section 3 (photo + stacking cards) — every knob for the scroll feel lives here.
 *
 * TIMELINE UNITS: 1 unit = one viewport-height of scrolling.
 * So `card: 0.85` means each card takes 0.85 screens of scroll to rise into place,
 * which is roughly 1:1 with your finger/wheel — the card "scrolls with the page".
 */

/** back -> front. Each new card rises from the bottom and lands on top of the previous one. */
export const STACK_CARDS = [
  { id: 'health',    label: 'Health',     color: '#218380' },
  { id: 'impact',    label: 'Impact',     color: '#FBB13C' },
  { id: 'growth',    label: 'Growth',     color: '#8F2D56' },
  { id: 'wellbeing', label: 'Well-being', color: '#73D2DE' },
] as const;

export const T = {
  expand: 0.9,    // photo grows from the inset frame to full-bleed
  gap: 0.12,      // breathing room after the photo fills the page, before card 1 appears
  card: 0.85,     // scroll length of one card rising into place
  between: 0.18,  // pause between one card landing and the next one starting
  tail: 0.5,      // hold on the finished stack before the section un-pins
} as const;

/** scroll position (timeline units) at which card `k` starts rising */
export const cardStart = (k: number) => T.expand + T.gap + k * (T.card + T.between);

/** total timeline length == total pinned scroll distance, in viewport heights */
export const TOTAL = cardStart(STACK_CARDS.length - 1) + T.card + T.tail;

/** the photo's starting frame (a rounded inset) and its full-bleed end state */
export const PHOTO_FROM = 'inset(10% 6% 10% 6% round 40px)';
export const PHOTO_TO = 'inset(0% 0% 0% 0% round 0px)';
/** the image itself also settles from a slight zoom while the frame opens up */
export const PHOTO_ZOOM_FROM = 1.14;
