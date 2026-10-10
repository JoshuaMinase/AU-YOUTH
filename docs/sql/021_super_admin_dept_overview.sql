-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Needs 017. The super admin is no longer put in every department chat. They only belong to the chats
-- they really belong to (their own department, the community group). To manage the others they get an
-- "All departments" list in the Admin panel that shows member lists and lets them add / remove people
-- WITHOUT being able to read the messages.

-- 1) new departments no longer add the super admin (same function as 017 minus that step)
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

  return new;
end;
$$;

-- 2) take the super admin out of department chats that are not their own department
delete from public.conversation_members m
using public.conversations c, public.departments d, public.admins a, public.profiles p
where m.conversation_id = c.id and c.dept_id = d.id
  and a.role = 'super_admin' and m.user_id = a.user_id
  and p.id = a.user_id
  and lower(btrim(d.name)) <> lower(btrim(coalesce(p.dept, '')));

-- 3) overview for the Admin panel: every department chat with its member count (super admin only)
create or replace function public.list_dept_chats()
returns table (conv_id uuid, dept_name text, member_count bigint)
language plpgsql stable
security definer set search_path = ''
as $$
begin
  if not private.is_super_admin() then
    raise exception 'only the super admin can list all department chats';
  end if;
  return query
  select c.id, d.name,
         (select count(*) from public.conversation_members m where m.conversation_id = c.id)
  from public.conversations c
  join public.departments d on d.id = c.dept_id
  order by d.name;
end;
$$;

-- 4) member list of one department chat (super admin, or an admin of that department); never the messages
create or replace function public.list_group_members(conv uuid)
returns table (user_id uuid, first_name text, last_name text, dept text, via_dept boolean)
language plpgsql stable
security definer set search_path = ''
as $$
begin
  if not private.can_manage_group(conv) then
    raise exception 'only an admin of this department can see its members';
  end if;
  return query
  select m.user_id, p.first_name, p.last_name, p.dept, m.via_dept
  from public.conversation_members m
  join public.profiles p on p.id = m.user_id
  where m.conversation_id = conv
  order by p.first_name, p.last_name;
end;
$$;

revoke execute on function public.list_dept_chats() from public, anon;
revoke execute on function public.list_group_members(uuid) from public, anon;
grant execute on function public.list_dept_chats() to authenticated;
grant execute on function public.list_group_members(uuid) to authenticated;
