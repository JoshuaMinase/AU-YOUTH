-- 039: no message can disappear without a saved copy for the admins.
-- Run in the Supabase SQL Editor AFTER 038. Safe to run more than once. No app change needed.
--
-- 038 saved a copy only when a member deleted their own message. Members have no way to delete a whole chat or their
-- own account (no such button, and the database has no policy for it), but an admin removing a department, or a user
-- removed from the Supabase dashboard, deletes their messages too. From now on those are saved as well.
-- Only ticket cards are skipped.

-- the member may already be gone when the copy is written (account removed), so the copy keeps the id without a foreign key
alter table public.deleted_messages drop constraint if exists deleted_messages_sender_id_fkey;

create or replace function private.archive_deleted_message()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  who text;
  label text;
begin
  if old.kind = 'ticket' then
    return old;
  end if;

  select btrim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')) into who
  from public.profiles p where p.id = old.sender_id;

  select case when c.is_group then coalesce(c.title, 'Group chat')
              else 'Direct message with ' || coalesce((
                select string_agg(btrim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ', ')
                from public.conversation_members m join public.profiles p on p.id = m.user_id
                where m.conversation_id = c.id and m.user_id <> old.sender_id), 'someone')
         end into label
  from public.conversations c where c.id = old.conversation_id;

  insert into public.deleted_messages
    (id, conversation_id, chat_label, sender_id, sender_name, body, kind, attachment_path, attachment_name,
     attachment_type, attachment_size, attachment_seconds, forwarded, sent_at)
  values
    (old.id, old.conversation_id, coalesce(label, 'a chat'), old.sender_id, coalesce(nullif(who, ''), 'A member'), old.body, old.kind,
     old.attachment_path, old.attachment_name, old.attachment_type, old.attachment_size, old.attachment_seconds,
     old.forwarded, old.created_at)
  on conflict (id) do nothing;
  return old;
end;
$$;
