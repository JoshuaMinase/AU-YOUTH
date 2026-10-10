-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Needs 011 (chats), 013 (roles), 014 (departments).
-- One group chat per department. A member joins the chat of the department on their profile
-- (and leaves it if they change department). Admins of that department, and the super admin,
-- can add and remove members. The "AU Intern Community" group stays as it is.

create schema if not exists private;

-- department names can be long, so allow longer group titles
alter table public.conversations drop constraint if exists conversations_title_check;
alter table public.conversations add constraint conversations_title_check
  check (title is null or char_length(btrim(title)) between 1 and 200);

-- which department a group belongs to (null = not a department chat)
alter table public.conversations add column if not exists dept_id uuid references public.departments (id) on delete cascade;
create unique index if not exists conversations_dept_idx on public.conversations (dept_id) where dept_id is not null;

-- true = joined automatically because of the profile department; false = added by an admin
alter table public.conversation_members add column if not exists via_dept boolean not null default false;

-- ── a department gets its chat the moment it exists ──────────────────
create or replace function private.create_dept_chat()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  conv uuid;
begin
  insert into public.conversations (is_group, title, dept_id)
  values (true, left(btrim(new.name), 200), new.id)
  on conflict do nothing;
  select id into conv from public.conversations where dept_id = new.id;

  -- everyone already in this department
  insert into public.conversation_members (conversation_id, user_id, via_dept)
  select conv, p.id, true from public.profiles p
  where lower(btrim(p.dept)) = lower(btrim(new.name))
  on conflict do nothing;

  -- the super admin oversees every department chat
  insert into public.conversation_members (conversation_id, user_id, via_dept)
  select conv, user_id, false from public.admins where role = 'super_admin'
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_department_chat on public.departments;
create trigger on_department_chat
  after insert on public.departments
  for each row execute function private.create_dept_chat();

-- ── a member joins / leaves chats when the profile department changes ─
-- (trigger name sorts after on_profile_department, so a newly typed department already exists here)
create or replace function private.sync_dept_chat()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.dept is not distinct from new.dept then
    return new;  -- saving the profile without changing department must not undo an admin's removal
  end if;

  -- leave department chats you were auto-joined to for another department
  delete from public.conversation_members m
  using public.conversations c, public.departments d
  where m.conversation_id = c.id and c.dept_id = d.id
    and m.user_id = new.id and m.via_dept
    and lower(btrim(d.name)) <> lower(btrim(coalesce(new.dept, '')));

  -- join the chat of the new department
  if btrim(coalesce(new.dept, '')) <> '' then
    insert into public.conversation_members (conversation_id, user_id, via_dept)
    select c.id, new.id, true
    from public.conversations c join public.departments d on d.id = c.dept_id
    where lower(btrim(d.name)) = lower(btrim(new.dept))
    on conflict (conversation_id, user_id) do update set via_dept = true;
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_dept_chat on public.profiles;
create trigger on_profile_dept_chat
  after insert or update of dept on public.profiles
  for each row execute function private.sync_dept_chat();

-- ── who may add / remove people ──────────────────────────────────────
-- the super admin, or an admin whose own profile department is this chat's department
create or replace function private.can_manage_group(conv uuid)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.conversations c
    join public.departments d on d.id = c.dept_id
    join public.admins a on a.user_id = (select auth.uid())
    join public.profiles p on p.id = a.user_id
    where c.id = conv
      and (a.role = 'super_admin' or lower(btrim(p.dept)) = lower(btrim(d.name)))
  );
$$;

revoke execute on function private.can_manage_group(uuid) from public, anon;
grant execute on function private.can_manage_group(uuid) to authenticated;

create or replace function public.add_group_member(conv uuid, member uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not private.can_manage_group(conv) then
    raise exception 'only an admin of this department can add people';
  end if;
  if not exists (select 1 from public.profiles where id = member) then
    raise exception 'unknown member';
  end if;
  insert into public.conversation_members (conversation_id, user_id, via_dept)
  values (conv, member, false)
  on conflict do nothing;
end;
$$;

create or replace function public.remove_group_member(conv uuid, member uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not private.can_manage_group(conv) then
    raise exception 'only an admin of this department can remove people';
  end if;
  if member <> auth.uid() and not private.is_super_admin()
     and exists (select 1 from public.admins where user_id = member) then
    raise exception 'only the super admin can remove an admin';
  end if;
  delete from public.conversation_members where conversation_id = conv and user_id = member;
end;
$$;

revoke execute on function public.add_group_member(uuid, uuid) from public, anon;
revoke execute on function public.remove_group_member(uuid, uuid) from public, anon;
grant execute on function public.add_group_member(uuid, uuid) to authenticated;
grant execute on function public.remove_group_member(uuid, uuid) to authenticated;

-- ── backfill: a chat for every department that exists now ────────────
insert into public.conversations (is_group, title, dept_id)
select true, left(btrim(d.name), 200), d.id from public.departments d
on conflict do nothing;

insert into public.conversation_members (conversation_id, user_id, via_dept)
select c.id, p.id, true
from public.conversations c
join public.departments d on d.id = c.dept_id
join public.profiles p on lower(btrim(p.dept)) = lower(btrim(d.name))
on conflict do nothing;

insert into public.conversation_members (conversation_id, user_id, via_dept)
select c.id, a.user_id, false
from public.conversations c cross join public.admins a
where c.dept_id is not null and a.role = 'super_admin'
on conflict do nothing;
