-- 038: admins can see messages that members delete (evidence of abuse or racism cannot be wiped away).
-- Run in the Supabase SQL Editor AFTER 037 and BEFORE pushing the app update. Safe to run more than once.
--
--  * Every time a member deletes their own message, a copy is saved in public.deleted_messages by a database
--    trigger. The member cannot skip or undo it: if the copy cannot be saved, the delete fails.
--  * Only admins (private.is_admin(): admins and the super admin) can read the copies. Nobody can edit or delete them from the app.
--  * The attached file is NOT removed any more. Admins may open the file of a deleted message; a member can no longer
--    remove a file that belongs to a message (or to a saved copy), so a photo cannot be wiped away from the storage API either.
--  * Files of messages that were never sent (blocked or failed uploads) can still be removed by their owner, as before (023).

-- 1) the saved copies
create table if not exists public.deleted_messages (
  id uuid primary key,                                    -- the id the message had
  conversation_id uuid not null,                          -- no foreign key: the copy outlives the chat
  chat_label text not null default 'a chat',              -- group title, or "Direct message with ..." (written when deleted)
  sender_id uuid references public.profiles (id) on delete set null,
  sender_name text not null default 'A member',
  body text not null default '',
  kind text not null default 'text',
  attachment_path text,
  attachment_name text,
  attachment_type text,
  attachment_size integer,
  attachment_seconds integer,
  forwarded boolean not null default false,
  sent_at timestamptz not null,
  deleted_at timestamptz not null default now()
);

create index if not exists deleted_messages_deleted_idx on public.deleted_messages (deleted_at desc);
create index if not exists deleted_messages_sender_idx on public.deleted_messages (sender_id);
create index if not exists deleted_messages_path_idx on public.deleted_messages (attachment_path) where attachment_path is not null;

alter table public.deleted_messages enable row level security;

drop policy if exists "admins read deleted messages" on public.deleted_messages;
create policy "admins read deleted messages"
  on public.deleted_messages for select to authenticated
  using (private.is_admin());
-- no insert / update / delete policy: only the trigger below writes here

-- 2) save a copy before the message goes (only when a member deletes their own message)
create or replace function private.archive_deleted_message()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  who text;
  label text;
begin
  if old.kind = 'ticket' or old.sender_id is distinct from (select auth.uid()) then
    return old;   -- ticket cards, and removals made by the system (a deleted chat or member), are not saved
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

drop trigger if exists on_message_archive on public.messages;
create trigger on_message_archive
  before delete on public.messages
  for each row execute function private.archive_deleted_message();

-- 3) files: a file that belongs to a message (or to a saved copy) cannot be removed by its owner, and admins can open files of saved copies
create or replace function private.chat_file_locked(obj text)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (select 1 from public.messages where attachment_path = obj)
      or exists (select 1 from public.deleted_messages where attachment_path = obj);
$$;

revoke execute on function private.chat_file_locked(text) from public, anon;
grant execute on function private.chat_file_locked(text) to authenticated;

drop policy if exists "owners delete own chat files" on storage.objects;
create policy "owners delete own chat files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'chat-files'
    and owner_id = (select auth.uid())::text
    and (select private.chat_file_member(name))
    and not (select private.chat_file_locked(name))
  );

drop policy if exists "admins read deleted chat files" on storage.objects;
create policy "admins read deleted chat files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'chat-files'
    and (select private.is_admin())
    and exists (select 1 from public.deleted_messages d where d.attachment_path = storage.objects.name)
  );

-- 4) live refresh of the admin list
do $$
begin
  alter publication supabase_realtime add table public.deleted_messages;
exception when duplicate_object then null;
end $$;
