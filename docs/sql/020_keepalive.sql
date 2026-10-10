-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- A tiny function the site's /api/ping calls every 10 minutes. It only returns the current time
-- (reads no tables, changes nothing), but it is a real database request, so Supabase's free plan
-- counts the project as active and does not pause it after 7 quiet days.

create or replace function public.keepalive()
returns timestamptz
language sql stable
set search_path = ''
as $$
  select now();
$$;

revoke execute on function public.keepalive() from public;
grant execute on function public.keepalive() to anon, authenticated;
