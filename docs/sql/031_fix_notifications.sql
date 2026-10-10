-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Needs 009 (news), 012 (notifications).
-- Fix: a scheduled article (published_at in the future) notified everyone at once, but its link
-- showed "not found" until the publish time because the article is hidden until then.
-- Now only articles that are already published notify. Scheduled ones do not notify at all.
-- Also: index so the unread count the home card shows stays fast.

create or replace function private.notify_news()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.published_at > now() then return new; end if;
  insert into public.notifications (user_id, kind, title, body, href)
  select p.id, 'news', 'New announcement posted', new.title, '/dashboard/news/' || new.slug
  from public.profiles p
  where p.id is distinct from new.author_id;
  return new;
end;
$$;

create index if not exists notifications_unread_idx on public.notifications (user_id) where read_at is null;
