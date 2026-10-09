// Lightweight health endpoint. The self-ping in instrumentation.ts calls it every 10 minutes
// so Render's free plan does not spin the service down after 15 minutes without traffic.
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ ok: true, time: new Date().toISOString() });
}
