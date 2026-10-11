-- 037: reply to a chat message + delete your own message.
-- Run in the Supabase SQL Editor BEFORE pushing the app update (the chats page reads the new columns).
-- Needs 011, 023 and 029 first. Needs Postgres 15 or newer (Supabase projects made since 2023 have it).
-- Safe to run more than once.
--
--  * Reply: messages.reply_to points at the message being answered, in the SAME conversation (enforced by the foreign key).
--  * Delete: a member can delete their own messages (never a ticket card). The row is removed for everyone.
--    A reply to a deleted message keeps its place and shows "Original message deleted" (reply_gone).
--    The attached file stays in the chat-files bucket so admins can still open it (see 038).

-- 1) the reply link. A composite foreign key keeps a reply in the conversation of the message it answers.
alter table public.messages add column if not exists reply_to uuid;
alter table public.messages add column if not exists reply_gone boolean not null default false;

alter table public.messages drop constraint if exists messages_id_conversation_key;
alter table public.messages add constraint messages_id_conversation_key unique (id, conversation_id);

alter table public.messages drop constraint if exists messages_reply_fk;
alter table public.messages add constraint messages_reply_fk
  foreign key (reply_to, conversation_id) references public.messages (id, conversation_id)
  on delete set null (reply_to);

create index if not exists messages_reply_idx on public.messages (reply_to) where reply_to is not null;

-- 2) before a message is deleted, mark the replies to it, so they can say "Original message deleted"
create or replace function private.mark_replies_gone()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.messages set reply_gone = true where reply_to = old.id;
  return old;
end;
$$;

drop trigger if exists on_message_deleted on public.messages;
create trigger on_message_deleted
  before delete on public.messages
  for each row execute function private.mark_replies_gone();

-- 3) delete your own message (not a ticket card), only in a conversation you are still in
drop policy if exists "delete own message" on public.messages;
create policy "delete own message"
  on public.messages for delete to authenticated
  using (
    (select auth.uid()) = sender_id
    and kind <> 'ticket'
    and private.is_member(conversation_id)
  );
