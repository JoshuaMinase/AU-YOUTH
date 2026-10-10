-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Needs 011 (chats). Run this BEFORE the app update is pushed, because the chats page reads the new columns.
-- Chat attachments, voice messages and forwarded messages.
--  * messages gets a kind (text / image / file / voice), the attached file's details and a "forwarded" flag.
--  * Files live in the PRIVATE bucket "chat-files", in a folder named after the conversation id
--    (<conversation id>/<random>.<ext>). Only members of that conversation can read, add or remove files there.
--  * Forwarding copies the file into the destination conversation's folder, so access always follows membership.

-- 1) messages: new columns
alter table public.messages add column if not exists kind text not null default 'text';
alter table public.messages add column if not exists attachment_path text;
alter table public.messages add column if not exists attachment_name text;
alter table public.messages add column if not exists attachment_type text;
alter table public.messages add column if not exists attachment_size integer;
alter table public.messages add column if not exists attachment_seconds integer;   -- voice messages only
alter table public.messages add column if not exists forwarded boolean not null default false;

-- 2) a message may now have an empty text when it carries a file (voice notes, photos without a caption)
alter table public.messages drop constraint if exists messages_body_check;
alter table public.messages drop constraint if exists messages_kind_check;
alter table public.messages drop constraint if exists messages_content_check;
alter table public.messages drop constraint if exists messages_attachment_check;

alter table public.messages add constraint messages_kind_check
  check (kind in ('text', 'image', 'file', 'voice'));

alter table public.messages add constraint messages_content_check check (
  char_length(body) <= 2000 and (
    (kind = 'text' and attachment_path is null and char_length(btrim(body)) >= 1)
    or (kind <> 'text'
        and attachment_path is not null
        and starts_with(attachment_path, conversation_id::text || '/')   -- the file must sit in this conversation's folder
        and attachment_name is not null)
  )
);

alter table public.messages add constraint messages_attachment_check check (
  (attachment_size is null or attachment_size between 1 and 10485760)
  and (attachment_seconds is null or attachment_seconds between 1 and 600)
  and (attachment_name is null or char_length(attachment_name) <= 120)
);

-- 3) private bucket: 10 MB per file; photos, PDF, Office documents, plain text / CSV and audio only
--    (no SVG, HTML, zip or executables)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-files', 'chat-files', false, 10485760,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf', 'text/plain', 'text/csv',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/aac', 'audio/wav', 'audio/x-m4a'
  ]
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 4) is the signed-in member in the conversation named by the first folder of the file path?
create schema if not exists private;

create or replace function private.chat_file_member(obj text)
returns boolean
language plpgsql stable
security definer set search_path = ''
as $$
declare
  conv uuid;
begin
  begin
    conv := (string_to_array(obj, '/'))[1]::uuid;
  exception when others then
    return false;   -- the path does not start with a conversation id
  end;
  return private.is_member(conv);
end;
$$;

revoke execute on function private.chat_file_member(text) from public, anon;
grant execute on function private.chat_file_member(text) to authenticated;

drop policy if exists "members upload chat files" on storage.objects;
create policy "members upload chat files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-files' and (select private.chat_file_member(name)));

drop policy if exists "members read chat files" on storage.objects;
create policy "members read chat files"
  on storage.objects for select to authenticated
  using (bucket_id = 'chat-files' and (select private.chat_file_member(name)));

-- you can remove a file you uploaded yourself (the app does this when a message is blocked or fails to send)
drop policy if exists "owners delete own chat files" on storage.objects;
create policy "owners delete own chat files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'chat-files' and owner_id = (select auth.uid())::text and (select private.chat_file_member(name)));
