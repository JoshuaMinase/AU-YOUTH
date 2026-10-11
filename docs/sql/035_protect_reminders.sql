-- 035: lock the reminder sender. Run in the Supabase SQL Editor (see the order in PAGES_STATUS.md).
-- Until now anyone holding the publishable key could call public.send_due_reminders() as often as they liked.
-- Now it needs a secret. The database keeps only a SHA-256 hash of it (private.app_secrets); the plain secret
-- lives in the PING_SECRET environment variable on Render, and /api/ping passes it in.
-- No secret is stored in this file. The hash is inserted by hand (a separate statement, see the end of this file).
-- Safe to run more than once.

create schema if not exists private;

create table if not exists private.app_secrets (
  name text primary key,
  value_hash text not null
);

-- nobody reads it through the API; only the security definer function below does
alter table private.app_secrets enable row level security;
revoke all on private.app_secrets from public, anon, authenticated;

-- the old function took no argument, so anyone could call it
drop function if exists public.send_due_reminders();

create or replace function public.send_due_reminders(secret text)
returns integer
language plpgsql
security definer set search_path = ''
as $$
declare
  r record;
  mins integer;
  sent integer := 0;
begin
  if secret is null or not exists (
    select 1 from private.app_secrets s
    where s.name = 'ping' and s.value_hash = encode(sha256(convert_to(secret, 'utf8')), 'hex')
  ) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  for r in
    select er.id, er.user_id, er.sent_24h, er.sent_45m,
           coalesce(nw.title, op.title) as title,
           coalesce(nw.event_at, op.event_at) as at,
           case when nw.id is not null then '/dashboard/news/' || nw.slug
                else '/dashboard/opportunities/' || op.slug end as href
    from public.event_reminders er
    left join public.news nw on nw.id = er.news_id
    left join public.opportunities op on op.id = er.opportunity_id
    where (not er.sent_24h or not er.sent_45m)
      and coalesce(nw.event_at, op.event_at) > now()
      and coalesce(nw.event_at, op.event_at) - now() <= interval '24 hours'
  loop
    mins := ceil(extract(epoch from (r.at - now())) / 60);
    if mins <= 45 and not r.sent_45m then
      insert into public.notifications (user_id, kind, title, body, href)
      values (r.user_id, 'reminder', 'Starting soon', left(r.title, 120) || ' is in about ' || mins || ' minutes.', r.href);
      update public.event_reminders set sent_45m = true, sent_24h = true where id = r.id;
      sent := sent + 1;
    elsif mins > 45 and not r.sent_24h then
      insert into public.notifications (user_id, kind, title, body, href)
      values (r.user_id, 'reminder', 'Coming up tomorrow', left(r.title, 120) || ' is in about ' || greatest(round(mins / 60.0), 1) || ' hours.', r.href);
      update public.event_reminders set sent_24h = true where id = r.id;
      sent := sent + 1;
    end if;
  end loop;
  return sent;
end;
$$;

revoke execute on function public.send_due_reminders(text) from public;
grant execute on function public.send_due_reminders(text) to anon;   -- /api/ping calls it with the publishable key; the secret is the lock

-- ── set (or change) the secret: run this ONE statement by hand, with the hash from the PowerShell snippet ──
-- insert into private.app_secrets (name, value_hash) values ('ping', 'PASTE-THE-HASH-HERE')
--   on conflict (name) do update set value_hash = excluded.value_hash;
