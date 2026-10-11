import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// The email-confirmation and password-reset links land here with ?code=... and are exchanged for a session.
// ?next= is allowed only for the reset page, so this can never redirect to another site.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const isReset = searchParams.get('next') === '/reset-password';

  // Behind Render's proxy the request origin can be internal; prefer the forwarded host.
  const forwardedHost = request.headers.get('x-forwarded-host');
  const base = forwardedHost ? `https://${forwardedHost}` : origin;

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${base}${isReset ? '/reset-password' : '/dashboard'}`);
  }
  return NextResponse.redirect(isReset ? `${base}/forgot-password?error=link` : `${base}/login?error=confirm`);
}
