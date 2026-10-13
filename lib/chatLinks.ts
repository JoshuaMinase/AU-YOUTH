/** Finds web links in a chat message so they can be shown as links. Only http(s) links count; anything else stays plain text. */
export type LinkPart = string | { text: string; href: string };

const URL_RE = /(?:https?:\/\/|www\.)[^\s<>"'`]+/gi;
const TRAILING = /[.,;:!?'"\]}]$/;

/** cut punctuation that belongs to the sentence, not the link ("see https://x.org/a." or "(https://x.org)") */
function trimEnd(raw: string): string {
  let u = raw;
  for (;;) {
    if (TRAILING.test(u)) { u = u.slice(0, -1); continue; }
    if (u.endsWith(')') && (u.match(/\)/g)?.length ?? 0) > (u.match(/\(/g)?.length ?? 0)) { u = u.slice(0, -1); continue; }
    return u;
  }
}

/** the full address to open, or null when it is not a normal web address */
export function toHref(text: string): string | null {
  const href = /^www\./i.test(text) ? `https://${text}` : text;
  try {
    const u = new URL(href);
    if ((u.protocol !== 'http:' && u.protocol !== 'https:') || !u.hostname.includes('.')) return null;
    return u.href;
  } catch { return null; }
}

export function splitLinks(text: string): LinkPart[] {
  const out: LinkPart[] = [];
  let last = 0;
  for (const m of text.matchAll(URL_RE)) {
    const start = m.index ?? 0;
    const shown = trimEnd(m[0]);
    const href = toHref(shown);
    if (!href) continue;
    if (start > last) out.push(text.slice(last, start));
    out.push({ text: shown, href });
    last = start + shown.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length ? out : [text];
}
