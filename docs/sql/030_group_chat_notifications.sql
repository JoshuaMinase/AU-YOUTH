-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Needs 011 (chats), 012 (notifications), 017 (department chats), 029 (ticket workflow).
-- A new message in a group chat notifies every other member (users and admins alike).
--  * Group chats only: the community chat and the department chats. 1:1 and ticket chats are not included.
--  * One unread notification per chat: more messages update it ("3 new messages in ...") instead of adding rows.
--  * Opening the chat marks it read (done by the app, lib/portal.ts markRead).
--  * Ticket cards in a department chat are skipped: create_ticket already notifies for those.

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('connection_request', 'connection_accepted', 'post_comment', 'news', 'delete_request', 'new_department', 'flagged_message', 'ticket', 'chat_message'));

create schema if not exists private;

create or replace function private.notify_group_message()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  conv_title text;
  link text;
  preview text;
begin
  if new.kind = 'ticket' then return new; end if;

  select coalesce(nullif(btrim(title), ''), 'a group chat') into conv_title
  from public.conversations where id = new.conversation_id and is_group;
  if not found then return new; end if;

  link := '/dashboard/chats?c=' || new.conversation_id::text;
  preview := private.display_name(new.sender_id) || case new.kind
    when 'image' then ' sent a photo'
    when 'voice' then ' sent a voice message'
    when 'file' then ' sent a file'
    else ': ' || left(new.body, 120)
  end;

  with recipients as (
    select cm.user_id,
      (select count(*) from public.messages x
        where x.conversation_id = new.conversation_id and x.kind <> 'ticket'
          and x.sender_id <> cm.user_id and x.created_at > cm.last_read_at) as n
    from public.conversation_members cm
    where cm.conversation_id = new.conversation_id and cm.user_id <> new.sender_id
  ), upd as (
    update public.notifications nt
    set title = case when r.n > 1 then r.n || ' new messages in ' || conv_title else 'New message in ' || conv_title end,
        body = preview, created_at = now()
    from recipients r
    where nt.user_id = r.user_id and nt.kind = 'chat_message' and nt.href = link and nt.read_at is null
    returning nt.user_id
  )
  insert into public.notifications (user_id, kind, title, body, href)
  select r.user_id, 'chat_message', 'New message in ' || conv_title, preview, link
  from recipients r
  where r.user_id not in (select user_id from upd);

  return new;
end;
$$;

drop trigger if exists on_group_message_notify on public.messages;
create trigger on_group_message_notify
  after insert on public.messages
  for each row execute function private.notify_group_message();
