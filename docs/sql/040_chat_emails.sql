-- 040: email notifications for 1:1 chats and ticket chats. Run in the Supabase SQL Editor AFTER 035 (it reuses the same secret).
-- Safe to run more than once. Needs the app update (lib/chatEmail.ts) and BREVO_API_KEY + EMAIL_FROM on Render to send anything.
--
-- How it works:
--  * /api/chat/send saves a message, then asks this function who should be emailed about it.
--  * Only 1:1 chats and ticket chats count (group chats already use in-app notifications, SQL 030). Ticket cards are skipped.
--  * Members' emails live in auth.users, which the app cannot read, so this function reads them (security definer)
--    and only answers when the caller knows the PING_SECRET (the database checks its hash, same as send_due_reminders).
--  * No spam: a person gets ONE email per chat. The next one comes only after they opened the chat (read marker moved),
--    or after 30 minutes if they still have not read it.
--  * Only a message sent in the last 5 minutes can trigger an email, and only in a chat that is not expired.

create schema if not exists private;

create table if not exists private.chat_email_log (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emailed_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

alter table private.chat_email_log enable row level security;
revoke all on private.chat_email_log from public, anon, authenticated;

create or replace function public.claim_chat_emails(secret text, msg uuid)
returns table (
  to_email text, to_name text, from_name text, chat_title text,
  is_ticket boolean, preview text, chat_id uuid
)
language plpgsql
security definer set search_path = ''
as $$
declare
  m public.messages;
  c public.conversations;
begin
  if secret is null or not exists (
    select 1 from private.app_secrets s
    where s.name = 'ping' and s.value_hash = encode(sha256(convert_to(secret, 'utf8')), 'hex')
  ) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  select * into m from public.messages where id = msg;
  if not found or m.kind = 'ticket' or m.created_at < now() - interval '5 minutes' then return; end if;

  select * into c from public.conversations where id = m.conversation_id;
  if not found or c.is_group or (c.expires_at is not null and c.expires_at <= now()) then return; end if;

  return query
  with due as (
    select cm.user_id
    from public.conversation_members cm
    left join private.chat_email_log l on l.conversation_id = cm.conversation_id and l.user_id = cm.user_id
    where cm.conversation_id = c.id and cm.user_id <> m.sender_id
      and (l.emailed_at is null or l.emailed_at < cm.last_read_at or l.emailed_at < now() - interval '30 minutes')
  ), logged as (
    insert into private.chat_email_log (conversation_id, user_id, emailed_at)
    select c.id, d.user_id, now() from due d
    on conflict (conversation_id, user_id) do update set emailed_at = excluded.emailed_at
    returning user_id
  )
  select u.email::text,
         private.display_name(d.user_id),
         private.display_name(m.sender_id),
         coalesce(nullif(btrim(c.title), ''), 'a chat'),
         c.ticket_id is not null,
         case m.kind
           when 'image' then 'sent a photo'
           when 'voice' then 'sent a voice message'
           when 'file' then 'sent a file'
           else left(btrim(m.body), 120)
         end,
         c.id
  from due d
  join auth.users u on u.id = d.user_id
  where u.email is not null;
end;
$$;

revoke execute on function public.claim_chat_emails(text, uuid) from public;
grant execute on function public.claim_chat_emails(text, uuid) to anon;   -- the server calls it with the publishable key; the secret is the lock
