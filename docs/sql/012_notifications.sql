-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Needs 004, 009, 010. Home "Notifications" card.
-- Rows are written only by the triggers below; members read them and mark them read.
-- "Profile tip" stays computed in the app from profileScore(), not stored.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('connection_request', 'connection_accepted', 'post_comment', 'news')),
  title text not null,
  body text not null default '',
  href text not null default '/dashboard' check (href like '/dashboard%'),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "see own notifications"
  on public.notifications for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "mark own notifications read"
  on public.notifications for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

create schema if not exists private;

create or replace function private.display_name(uid uuid)
returns text
language sql stable
security definer set search_path = ''
as $$
  select coalesce(nullif(btrim(concat_ws(' ', first_name, last_name)), ''), 'A member')
  from public.profiles where id = uid;
$$;

revoke execute on function private.display_name(uuid) from public, anon, authenticated;

-- connection request sent / accepted
create or replace function private.notify_connection()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, kind, title, body, href)
    values (new.addressee_id, 'connection_request', 'New connection request',
            private.display_name(new.requester_id) || ' wants to connect with you.', '/dashboard/people');
  elsif old.status = 'pending' and new.status = 'accepted' then
    insert into public.notifications (user_id, kind, title, body, href)
    values (new.requester_id, 'connection_accepted', 'Connection accepted',
            private.display_name(new.addressee_id) || ' accepted your request.', '/dashboard/people');
  end if;
  return new;
end;
$$;

drop trigger if exists on_connection_notify on public.connections;
create trigger on_connection_notify
  after insert or update of status on public.connections
  for each row execute function private.notify_connection();

-- someone commented on your post
create or replace function private.notify_comment()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  owner uuid;
begin
  select author_id into owner from public.posts where id = new.post_id;
  if owner is not null and owner <> new.author_id then
    insert into public.notifications (user_id, kind, title, body, href)
    values (owner, 'post_comment', 'New comment on your post',
            private.display_name(new.author_id) || ': ' || left(new.body, 120), '/dashboard#' || new.post_id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_comment_notify on public.post_comments;
create trigger on_comment_notify
  after insert on public.post_comments
  for each row execute function private.notify_comment();

-- new article: tell every member (fine at community size; revisit past a few thousand members)
-- note: fires at insert time, so a scheduled article notifies before it is visible
create or replace function private.notify_news()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.notifications (user_id, kind, title, body, href)
  select p.id, 'news', 'New announcement posted', new.title, '/dashboard/news/' || new.slug
  from public.profiles p
  where p.id is distinct from new.author_id;
  return new;
end;
$$;

drop trigger if exists on_news_notify on public.news;
create trigger on_news_notify
  after insert on public.news
  for each row execute function private.notify_news();

alter publication supabase_realtime add table public.notifications;
