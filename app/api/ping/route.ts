// Health endpoint. The self-ping in instrumentation.ts calls it every 10 minutes so that
//  - Render's free plan does not spin the service down after 15 minutes without traffic, and
//  - Supabase's free plan sees database activity and does not pause the project after 7 quiet days
//    (it runs the tiny public.keepalive() function from docs/sql/020_keepalive.sql),
//  - it also sends the "Notify me" reminders that are due (public.send_due_reminders(), docs/sql/033 + 035), so they can be up to 10 minutes late.
// It needs the header `x-ping-secret` to equal the PING_SECRET environment variable (set on Render). Without it nothing runs,
// and the database function checks the same secret again (docs/sql/035), so calling the function directly with the publishable key does not work either.
// The database part never breaks the ping: if it fails, the answer is still 200 with db: false.
import { createHash, timingSafeEqual } from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/** constant-time comparison (both sides are hashed first, so the lengths always match) */
function sameSecret(given: string | null, expected: string) {
  if (!given) return false;
  const h = (v: string) => createHash('sha256').update(v).digest();
  return timingSafeEqual(h(given), h(expected));
}

export async function GET(request: Request) {
  const secret = process.env.PING_SECRET;
  if (!secret) {
    console.error('[ping] PING_SECRET is not set on the server, so the ping is refused. Set it in Render -> Environment.');
    return Response.json({ ok: false }, { status: 401 });
  }
  if (!sameSecret(request.headers.get('x-ping-secret'), secret)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  let db = false;
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { error } = await supabase.rpc('keepalive');
    db = !error;
    if (error) console.error('[ping] database keepalive failed:', error.message);
    // "Notify me" reminders (docs/sql/033, locked by docs/sql/035): sends the 24 h / 45 min notices that are due; never breaks the ping
    const due = await supabase.rpc('send_due_reminders', { secret });
    if (due.error) console.error('[ping] reminders failed:', due.error.message);
  } catch (e) {
    console.error('[ping] database keepalive failed:', e);
  }
  return Response.json({ ok: true, db, time: new Date().toISOString() });
}
