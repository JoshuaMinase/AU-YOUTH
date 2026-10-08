import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Refreshes the Supabase session on every request and guards the portal.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Do not run code between createServerClient and getUser().
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  const redirectTo = (to: string) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = '';
    const redirect = NextResponse.redirect(url);
    // keep any refreshed auth cookies on the redirect
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  if (!user && path.startsWith('/dashboard')) return redirectTo('/login');
  if (user && (path === '/login' || path === '/sign-up')) return redirectTo('/dashboard');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets|SVG|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)'],
};
