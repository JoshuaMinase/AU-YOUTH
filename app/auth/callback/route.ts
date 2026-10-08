import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// The email-confirmation link lands here with ?code=... and is exchanged for a session.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // Behind Render's proxy the request origin can be internal; prefer the forwarded host.
  const forwardedHost = request.headers.get('x-forwarded-host');
  const base = forwardedHost ? `https://${forwardedHost}` : origin;

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${base}/dashboard`);
  }
  return NextResponse.redirect(`${base}/login?error=confirm`);
}
