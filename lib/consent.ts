// Cookie notice choice, kept in localStorage under `auy-cookie-consent`.
// Today the site sets only essential storage (the sign-in session and this notice) and no analytics or advertising,
// so the notice is informational. If an optional tool is ever added (analytics, embeds), it MUST stay off until
// `analytics` is true here, and the banner must then offer a real "Essential only" choice.
export const CONSENT_KEY = 'auy-cookie-consent';
export const CONSENT_VERSION = 1;
/** the footer and the Cookie Policy fire this to open the banner again */
export const CONSENT_OPEN_EVENT = 'auy-open-cookie-notice';

export interface Consent { version: number; at: string; analytics: boolean }

export function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Consent;
    return c && c.version === CONSENT_VERSION ? c : null;
  } catch { return null; }
}

export function saveConsent(): Consent {
  const c: Consent = { version: CONSENT_VERSION, at: new Date().toISOString(), analytics: false };
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(c)); } catch { /* storage blocked: the notice shows again next visit */ }
  return c;
}
