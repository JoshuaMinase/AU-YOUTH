// Runs once when the Next.js server starts (Node runtime only).
// Pings our own public URL every 10 minutes so Render's free plan (spins down after 15 min
// of no inbound traffic) keeps the service awake.
const PING_EVERY_MS = 10 * 60 * 1000;

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.NODE_ENV !== 'production') return;

  const g = globalThis as typeof globalThis & { __auyPingStarted?: boolean };
  if (g.__auyPingStarted) return;
  g.__auyPingStarted = true;

  // Render sets RENDER_EXTERNAL_URL automatically; the fallback is the live site.
  const base = (process.env.RENDER_EXTERNAL_URL || 'https://au-youth.onrender.com').replace(/\/$/, '');
  const url = `${base}/api/ping`;

  const ping = async () => {
    try {
      const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(30_000) });
      console.log(`[self-ping] ${res.status} ${url}`);
    } catch (err) {
      console.warn('[self-ping] failed:', err instanceof Error ? err.message : err);
    }
  };

  const timer = setInterval(ping, PING_EVERY_MS);
  timer.unref?.();
}
