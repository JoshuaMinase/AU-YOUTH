-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Needs 009 (news), 012 (notifications), 013 (roles), 022 (profile gate).
--  1. News gets an optional event date/time. Members can press "Notify me": they get a notification
--     24 hours and 45 minutes before it (event_reminders + public.send_due_reminders()).
--  2. Opportunities leave the news section and get their own table, page and notifications.
--     Besides "Notify me" they have Apply (opens apply_url) or, when there is no link, Register.
--     Registrations land in opportunity_registrations; admins read the list on the opportunity page.
--  3. Opportunity articles already in news are moved over, and "Opportunities" is removed as a news category.
-- The reminders are sent by /api/ping (it already runs every 10 minutes), so a reminder can be up to
-- 10 minutes late. The app must be deployed with the ping change from this release.

-- ── news: event date ─────────────────────────────────────────────
alter table public.news add column if not exists event_at timestamptz;

-- ── opportunities ────────────────────────────────────────────────
create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  kind text not null default 'Other' check (kind in ('Internship', 'Fellowship', 'Volunteer', 'Event', 'Other')),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  excerpt text not null default '' check (char_length(excerpt) <= 400),
  body text[] not null default '{}',
  source text not null default 'AU Commission' check (char_length(source) <= 60),
  img text not null default '/assets/card-img-1.webp',
  -- with a link, Apply opens it; without one, members register on the site
  apply_url text check (apply_url is null or apply_url ~* '^https?://'),
  -- the date members are reminded about (event day, or the deadline)
  event_at timestamptz,
  author_id uuid default auth.uid() references public.profiles (id) on delete set null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists opportunities_published_idx on public.opportunities (published_at desc);
create index if not exists opportunities_author_idx on public.opportunities (author_id);

alter table public.opportunities enable row level security;

create policy "read published opportunities"
  on public.opportunities for select to authenticated
  using (published_at <= now() or (select private.is_admin()));
create policy "admins add opportunities"
  on public.opportunities for insert to authenticated
  with check ((select private.is_admin()));
create policy "admins edit opportunities"
  on public.opportunities for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete opportunities"
  on public.opportunities for delete to authenticated
  using ((select private.is_admin()));

alter publication supabase_realtime add table public.opportunities;

-- move the opportunity articles out of news (before the notify trigger exists, so nobody is notified)
insert into public.opportunities (slug, kind, title, excerpt, body, source, img, author_id, published_at)
select slug, 'Other', title, excerpt, body, source, img, author_id, published_at
from public.news where cat = 'Opportunities'
on conflict (slug) do nothing;

delete from public.news where cat = 'Opportunities';

alter table public.news drop constraint if exists news_cat_check;
alter table public.news add constraint news_cat_check
  check (cat in ('Initiatives', 'Events', 'Partnerships', 'Announcements', 'Development'));

-- ── registrations ────────────────────────────────────────────────
create table if not exists public.opportunity_registrations (
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (opportunity_id, user_id)
);

create index if not exists opportunity_registrations_user_idx on public.opportunity_registrations (user_id);

alter table public.opportunity_registrations enable row level security;

-- you see your own registrations; admins see everyone's (the list board)
create policy "see registrations"
  on public.opportunity_registrations for select to authenticated
  using ((select auth.uid()) = user_id or (select private.is_admin()));
create policy "register yourself"
  on public.opportunity_registrations for insert to authenticated
  with check ((select auth.uid()) = user_id and (select private.profile_complete((select auth.uid()))));
create policy "cancel own registration"
  on public.opportunity_registrations for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ── "Notify me" ──────────────────────────────────────────────────
create table if not exists public.event_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  news_id uuid references public.news (id) on delete cascade,
  opportunity_id uuid references public.opportunities (id) on delete cascade,
  sent_24h boolean not null default false,
  sent_45m boolean not null default false,
  created_at timestamptz not null default now(),
  check ((news_id is null) <> (opportunity_id is null))
);

create unique index if not exists event_reminders_news_idx on public.event_reminders (user_id, news_id) where news_id is not null;
create unique index if not exists event_reminders_opp_idx on public.event_reminders (user_id, opportunity_id) where opportunity_id is not null;
create index if not exists event_reminders_news_item_idx on public.event_reminders (news_id);
create index if not exists event_reminders_opp_item_idx on public.event_reminders (opportunity_id);

alter table public.event_reminders enable row level security;

create policy "see own reminders"
  on public.event_reminders for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "set own reminder"
  on public.event_reminders for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "remove own reminder"
  on public.event_reminders for delete to authenticated
  using ((select auth.uid()) = user_id);

-- members choose only what to be reminded about; the sent flags are set by the database
revoke insert on public.event_reminders from authenticated;
grant insert (news_id, opportunity_id) on public.event_reminders to authenticated;

-- on sign-up for a reminder: needs a future date; skips a reminder whose time has already passed
create or replace function private.set_reminder_flags()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  at timestamptz;
begin
  if new.news_id is not null then
    select event_at into at from public.news where id = new.news_id;
  else
    select event_at into at from public.opportunities where id = new.opportunity_id;
  end if;
  if at is null or at <= now() then
    raise exception 'This has no upcoming date to remind you about.';
  end if;
  new.sent_24h := (at - now() <= interval '24 hours');
  new.sent_45m := (at - now() <= interval '45 minutes');
  return new;
end;
$$;

drop trigger if exists on_reminder_flags on public.event_reminders;
create trigger on_reminder_flags
  before insert on public.event_reminders
  for each row execute function private.set_reminder_flags();

-- an admin moves the date: reminders that were not due yet are armed again for the new time
create or replace function private.rearm_reminders()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.event_at is distinct from old.event_at and new.event_at is not null and new.event_at > now() then
    if tg_table_name = 'news' then
      update public.event_reminders
        set sent_24h = (new.event_at - now() <= interval '24 hours'), sent_45m = (new.event_at - now() <= interval '45 minutes')
        where news_id = new.id;
    else
      update public.event_reminders
        set sent_24h = (new.event_at - now() <= interval '24 hours'), sent_45m = (new.event_at - now() <= interval '45 minutes')
        where opportunity_id = new.id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_news_rearm on public.news;
create trigger on_news_rearm
  after update of event_at on public.news
  for each row execute function private.rearm_reminders();

drop trigger if exists on_opportunity_rearm on public.opportunities;
create trigger on_opportunity_rearm
  after update of event_at on public.opportunities
  for each row execute function private.rearm_reminders();

-- ── notifications: new kinds + "new opportunity" for everyone ────
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('connection_request', 'connection_accepted', 'post_comment', 'news', 'delete_request', 'new_department', 'flagged_message', 'ticket', 'chat_message', 'opportunity', 'reminder'));

create or replace function private.notify_opportunity()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.published_at > now() then return new; end if;
  insert into public.notifications (user_id, kind, title, body, href)
  select p.id, 'opportunity', 'New opportunity posted', new.title, '/dashboard/opportunities/' || new.slug
  from public.profiles p
  where p.id is distinct from new.author_id;
  return new;
end;
$$;

drop trigger if exists on_opportunity_notify on public.opportunities;
create trigger on_opportunity_notify
  after insert on public.opportunities
  for each row execute function private.notify_opportunity();

-- ── the reminder sender (called by /api/ping every 10 minutes) ───
-- Each person gets at most one notice per step: about 24 hours before, and about 45 minutes before.
-- Nothing is sent once the event has started. Safe to call as often as you like.
create or replace function public.send_due_reminders()
returns integer
language plpgsql
security definer set search_path = ''
as $$
declare
  r record;
  mins integer;
  sent integer := 0;
begin
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

revoke execute on function public.send_due_reminders() from public;
grant execute on function public.send_due_reminders() to anon, authenticated;
