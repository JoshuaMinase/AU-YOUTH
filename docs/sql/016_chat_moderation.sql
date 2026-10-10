-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Needs 011 (chats), 012 (notifications), 013 (roles).
-- AI chat screening: a message the AI flags is NOT sent. It is logged here for admins to review,
-- and every admin gets a notification. Nothing in this file calls the AI; the app route does.

create schema if not exists private;

create table if not exists public.moderation_flags (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete set null,
  body text not null,
  categories text[] not null default '{}',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null
);

create index if not exists moderation_flags_created_idx on public.moderation_flags (created_at desc);
create index if not exists moderation_flags_sender_idx on public.moderation_flags (sender_id);
create index if not exists moderation_flags_reviewer_idx on public.moderation_flags (reviewed_by);
create index if not exists moderation_flags_conversation_idx on public.moderation_flags (conversation_id);

alter table public.moderation_flags enable row level security;

-- only admins read the log; rows are written only by report_flagged_message()
create policy "admins read flags"
  on public.moderation_flags for select to authenticated
  using (private.is_admin());

create policy "admins mark flags reviewed"
  on public.moderation_flags for update to authenticated
  using (private.is_admin()) with check (private.is_admin());

revoke update on public.moderation_flags from authenticated;
grant update (reviewed_at, reviewed_by) on public.moderation_flags to authenticated;

-- notification kind used for the admin alert
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('connection_request', 'connection_accepted', 'post_comment', 'news', 'delete_request', 'new_department', 'flagged_message'));

-- called by the app after the AI blocks a message: logs it and tells every admin
create or replace function public.report_flagged_message(conv uuid, msg text, cats text[])
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  clean text := left(btrim(coalesce(msg, '')), 2000);
begin
  if me is null or clean = '' then
    raise exception 'invalid report';
  end if;
  if not private.is_member(conv) then
    raise exception 'not a member of this conversation';
  end if;
  -- at most 30 reports per member per hour, so this cannot be used to flood the admins
  if (select count(*) from public.moderation_flags
      where sender_id = me and created_at > now() - interval '1 hour') >= 30 then
    return;
  end if;

  insert into public.moderation_flags (sender_id, conversation_id, body, categories)
  values (me, conv, clean, coalesce(cats, '{}'));

  insert into public.notifications (user_id, kind, title, body, href)
  select user_id, 'flagged_message', 'Message blocked by AI',
         private.display_name(me) || ' tried to send a message that was blocked. Open the admin panel to review it.',
         '/dashboard/admin'
  from public.admins
  where user_id <> me;
end;
$$;

revoke execute on function public.report_flagged_message(uuid, text, text[]) from public, anon;
grant execute on function public.report_flagged_message(uuid, text, text[]) to authenticated;
