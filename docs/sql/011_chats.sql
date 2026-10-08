-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Chats page, header unread badge and home quick chat.
-- 1:1 chats between connected members, plus one community group everyone is in.

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  title text check (title is null or char_length(btrim(title)) between 1 and 80),  -- groups only
  -- 1:1 key '<smaller uuid>:<larger uuid>', so the same pair never gets two chats
  dm_key text unique,
  -- 'community' marks the group every member joins automatically
  slug text unique,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (is_group = (dm_key is null))
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- unread = messages newer than this
  last_read_at timestamptz not null default now(),
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists conversation_members_user_idx on public.conversation_members (user_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);
create index if not exists messages_sender_idx on public.messages (sender_id);

-- security definer so the members policy can check membership without looping on itself
create schema if not exists private;

create or replace function private.is_member(conv uuid)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = conv and user_id = (select auth.uid())
  );
$$;

revoke execute on function private.is_member(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_member(uuid) to authenticated;

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

-- conversations: read the ones you're in; created only through start_dm()
create policy "see own conversations"
  on public.conversations for select to authenticated
  using (private.is_member(id));

-- members: see who else is in your conversations; you may only move your own read marker
create policy "see fellow members"
  on public.conversation_members for select to authenticated
  using (private.is_member(conversation_id));

create policy "mark own conversation read"
  on public.conversation_members for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke update on public.conversation_members from authenticated;
grant update (last_read_at) on public.conversation_members to authenticated;

-- messages: read and send in your conversations only, as yourself
create policy "read messages in own conversations"
  on public.messages for select to authenticated
  using (private.is_member(conversation_id));

create policy "send message as yourself"
  on public.messages for insert to authenticated
  with check ((select auth.uid()) = sender_id and private.is_member(conversation_id));

-- keep conversations.last_message_at current (members can't update conversations directly)
create or replace function private.touch_conversation()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  -- sending counts as reading
  update public.conversation_members set last_read_at = new.created_at
    where conversation_id = new.conversation_id and user_id = new.sender_id;
  return new;
end;
$$;

drop trigger if exists on_message_sent on public.messages;
create trigger on_message_sent
  after insert on public.messages
  for each row execute function private.touch_conversation();

-- open (or create) a 1:1 chat with someone you're connected to; returns the conversation id
create or replace function public.start_dm(other uuid)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  key text;
  conv uuid;
begin
  if me is null or other is null or other = me then
    raise exception 'invalid chat partner';
  end if;
  if not exists (
    select 1 from public.connections
    where status = 'accepted'
      and least(requester_id, addressee_id) = least(me, other)
      and greatest(requester_id, addressee_id) = greatest(me, other)
  ) then
    raise exception 'you can only message people you are connected with';
  end if;

  key := least(me, other)::text || ':' || greatest(me, other)::text;
  insert into public.conversations (dm_key) values (key) on conflict (dm_key) do nothing;
  select id into conv from public.conversations where dm_key = key;
  insert into public.conversation_members (conversation_id, user_id)
    values (conv, me), (conv, other)
    on conflict do nothing;
  return conv;
end;
$$;

revoke execute on function public.start_dm(uuid) from public, anon;
grant execute on function public.start_dm(uuid) to authenticated;

-- community group: create it, add everyone already signed up, and every new member from now on
insert into public.conversations (is_group, title, slug)
values (true, 'AU Intern Community', 'community')
on conflict (slug) do nothing;

insert into public.conversation_members (conversation_id, user_id)
select c.id, p.id from public.conversations c cross join public.profiles p
where c.slug = 'community'
on conflict do nothing;

create or replace function private.join_community()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.conversation_members (conversation_id, user_id)
  select id, new.id from public.conversations where slug = 'community'
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_join_community on public.profiles;
create trigger on_profile_join_community
  after insert on public.profiles
  for each row execute function private.join_community();

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversation_members;
