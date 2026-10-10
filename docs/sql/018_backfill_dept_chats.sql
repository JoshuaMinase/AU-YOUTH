-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Needs 017. Gives every member who already has a department on their profile a chat for it:
-- 1) any department typed on a profile that is not in the departments list yet is added to it
--    (the 017 trigger then creates its group chat and adds the members who have it),
-- 2) every department chat is checked again so no existing member is missed.
-- Safe to run more than once.

insert into public.departments (name, added_by)
select distinct on (lower(btrim(p.dept))) btrim(p.dept), p.id
from public.profiles p
where btrim(coalesce(p.dept, '')) <> ''
  and not exists (select 1 from public.departments d where lower(btrim(d.name)) = lower(btrim(p.dept)))
order by lower(btrim(p.dept)), p.id
on conflict do nothing;

-- departments that somehow still have no chat
insert into public.conversations (is_group, title, dept_id)
select true, left(btrim(d.name), 200), d.id from public.departments d
on conflict do nothing;

-- every existing member into the chat of their department
insert into public.conversation_members (conversation_id, user_id, via_dept)
select c.id, p.id, true
from public.conversations c
join public.departments d on d.id = c.dept_id
join public.profiles p on lower(btrim(p.dept)) = lower(btrim(d.name))
on conflict do nothing;

-- the super admin in every department chat
insert into public.conversation_members (conversation_id, user_id, via_dept)
select c.id, a.user_id, false
from public.conversations c cross join public.admins a
where c.dept_id is not null and a.role = 'super_admin'
on conflict do nothing;
