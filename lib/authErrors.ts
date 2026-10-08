import { ALLOWED_DOMAINS } from './data';

const DOMAINS = ALLOWED_DOMAINS.map((d) => `@${d}`).join(' or ');

/** Sign-up refused because the email isn't an AU address (checked in the form and by the database). */
export const DOMAIN_MSG = `Sign-up is only open to AU staff emails (${DOMAINS}). Use your work email address.`;

/**
 * Turn a Supabase auth error into plain words: what went wrong and how to fix it.
 * Codes: https://supabase.com/docs/guides/auth/debugging/error-codes
 */
export function authErrorMessage(err: { message: string; code?: string; status?: number }, during: 'login' | 'signup') {
  const code = err.code ?? '';
  const msg = err.message ?? '';

  if (code === 'over_email_send_rate_limit' || /email rate limit/i.test(msg))
    return 'Too many confirmation emails have been sent in the last hour, so we can’t send yours right now. Please wait about an hour and try again. If it keeps happening, tell the platform team.';
  if (code === 'over_request_rate_limit' || err.status === 429)
    return 'Too many attempts in a short time. Wait a few minutes, then try again.';
  if (code === 'user_already_exists' || code === 'email_exists' || /already registered|already exists/i.test(msg))
    return 'An account with this email already exists. Log in instead. If you never confirmed it, check your inbox (and spam) for the confirmation email.';
  if (code === 'weak_password' || /password should/i.test(msg))
    return 'That password is too weak. Use at least 8 characters with a mix of letters and numbers.';
  if (code === 'email_address_invalid' || /invalid.*email|email.*invalid/i.test(msg))
    return 'That email address doesn’t look right. Check it for typos and try again.';
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(msg))
    return 'The email or password is wrong. Check both (passwords are case-sensitive) and try again.';
  if (code === 'email_not_confirmed' || /not confirmed/i.test(msg))
    return 'Your email isn’t confirmed yet. Open the confirmation email we sent you (check spam too), click the link, then log in.';
  if (code === 'signup_disabled' || /signups not allowed/i.test(msg))
    return 'New sign-ups are closed right now. Please contact the platform team.';
  if (/failed to fetch|network/i.test(msg))
    return 'We can’t reach the server. Check your internet connection and try again.';
  // the database refuses non-AU emails; Supabase reports that as a generic database error
  if (during === 'signup' && (code === 'unexpected_failure' || /database error/i.test(msg)))
    return DOMAIN_MSG;
  return `Something went wrong (${msg || 'unknown error'}). Please try again in a moment. If it keeps happening, tell the platform team.`;
}
