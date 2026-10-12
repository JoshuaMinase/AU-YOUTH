-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Needs 013. Makes StephanieT@africanunion.org a super admin together with ZemenA@africanunion.org.
--   1) 013 allowed only one super admin (unique index admins_one_super_idx). That index is dropped.
--   2) Stephanie must already have signed up (a row in profiles). If not, nothing changes and you get an error.
--   3) She is added to public.admins with role 'super_admin' (an existing admin row of hers is upgraded).
-- Zemen's row is not touched. set_admin() still only creates plain admins, so more super admins can only be added with SQL like this.
-- To undo for her: delete from public.admins where user_id = (select id from auth.users where lower(email) = 'stephaniet@africanunion.org');

drop index if exists public.admins_one_super_idx;

do $$
declare
  target uuid;
  boss uuid;
begin
  select u.id into target
  from auth.users u join public.profiles p on p.id = u.id
  where lower(u.email) = 'stephaniet@africanunion.org';

  if target is null then
    raise exception 'stephaniet@africanunion.org has no account with a profile yet. Ask her to sign up and finish verifying, then run this again';
  end if;

  select a.user_id into boss from public.admins a where a.role = 'super_admin' and a.user_id <> target limit 1;

  insert into public.admins (user_id, role, granted_by)
  values (target, 'super_admin', boss)
  on conflict (user_id) do update set role = 'super_admin';
end;
$$;

-- check: should list both super admins
select u.email, a.role, a.created_at
from public.admins a join auth.users u on u.id = a.user_id
where a.role = 'super_admin'
order by u.email;
