// Health endpoint. The self-ping in instrumentation.ts calls it every 10 minutes so that
//  - Render's free plan does not spin the service down after 15 minutes without traffic, and
//  - Supabase's free plan sees database activity and does not pause the project after 7 quiet days
//    (it runs the tiny public.keepalive() function from docs/sql/020_keepalive.sql).
// The database part never breaks the ping: if it fails, the answer is still 200 with db: false.
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
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
  } catch (e) {
    console.error('[ping] database keepalive failed:', e);
  }
  return Response.json({ ok: true, db, time: new Date().toISOString() });
}
