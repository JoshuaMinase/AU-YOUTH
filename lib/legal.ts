// The facts the legal pages quote. Edit them here and nowhere else.
// Have a lawyer read the legal pages before launch (see todo.md).
export const LEGAL = {
  siteName: 'AU Youth Community',
  siteUrl: 'https://au-youth.onrender.com',
  /** who runs the site: use the exact legal name of the organisation */
  operator: 'the AU Youth Community team',
  contactEmail: 'ZemenA@africanunion.org',
  governingLaw: 'the Federal Democratic Republic of Ethiopia',
  courtsPlace: 'Addis Ababa, Ethiopia',
  /** shown on every legal page */
  updated: '12 October 2026',
  /** saved with each new account when the Terms box is ticked; change it when the Terms or Privacy Policy change in a way that matters */
  termsVersion: '2026-10-12',
  minAge: 18,
} as const;

export const LEGAL_LINKS = [
  ['Privacy Policy', '/privacy'],
  ['Terms of Use', '/terms'],
  ['Cookie Policy', '/cookies'],
  ['Acceptable Use', '/acceptable-use'],
] as const;
