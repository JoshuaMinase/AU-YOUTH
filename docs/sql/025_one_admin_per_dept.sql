-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Needs 013 and 014. Enforces "one admin per department":
--   1) set_admin() refuses to make someone admin if they have no department, or if their department already has an admin.
--   2) an admin cannot move into a department that already has another admin (edit profile).
-- The super admin does not count as a department admin. Existing admins are left as they are.

create or replace function public.set_admin(target uuid, make boolean)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  d text;
begin
  if not private.is_super_admin() then
    raise exception 'only the super admin can change admins';
  end if;
  if target is null or target = auth.uid() then
    raise exception 'invalid member';
  end if;
  if make then
    select lower(btrim(coalesce(dept, ''))) into d from public.profiles where id = target;
    if d is null or d = '' then
      raise exception 'this member has no department yet. Ask them to fill it in on their profile first';
    end if;
    if exists (
      select 1 from public.admins a join public.profiles p on p.id = a.user_id
      where a.role = 'admin' and a.user_id <> target and lower(btrim(coalesce(p.dept, ''))) = d
    ) then
      raise exception 'this department already has an admin. Remove them first';
    end if;
    insert into public.admins (user_id, role, granted_by) values (target, 'admin', auth.uid())
    on conflict (user_id) do nothing;
  else
    delete from public.admins where user_id = target and role = 'admin';
  end if;
end;
$$;

revoke execute on function public.set_admin(uuid, boolean) from public, anon;
grant execute on function public.set_admin(uuid, boolean) to authenticated;

-- an admin changing department must not collide with another admin
create or replace function private.admin_dept_unique()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if lower(btrim(coalesce(new.dept, ''))) <> ''
     and lower(btrim(coalesce(new.dept, ''))) is distinct from lower(btrim(coalesce(old.dept, '')))
     and exists (select 1 from public.admins where user_id = new.id and role = 'admin')
     and exists (
       select 1 from public.admins a join public.profiles p on p.id = a.user_id
       where a.role = 'admin' and a.user_id <> new.id
         and lower(btrim(coalesce(p.dept, ''))) = lower(btrim(new.dept))
     ) then
    raise exception 'that department already has an admin';
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_admin_dept_unique on public.profiles;
create trigger on_profile_admin_dept_unique
  before update of dept on public.profiles
  for each row execute function private.admin_dept_unique();
