-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Needs 002 (profiles.role) and 013 (super admin). Role pick-list for the profile form.
-- Intern, Fellow and Volunteer are the starting options. A role a member types that isn't on the list
-- is added for everyone from then on (same idea as departments, docs/sql/014).
-- A role typed in a different case ("intern") is saved with the listed spelling ("Intern").
-- Roles already saved on profiles are added to the list too.

create table if not exists public.member_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 40),
  added_by uuid references public.profiles (id) on delete set null,  -- null = from the starting list
  created_at timestamptz not null default now()
);

create unique index if not exists member_roles_name_idx on public.member_roles (lower(btrim(name)));
create index if not exists member_roles_added_by_idx on public.member_roles (added_by);

alter table public.member_roles enable row level security;

create policy "read member roles"
  on public.member_roles for select to authenticated using (true);

-- new names arrive only through the profile triggers below; the super admin can remove wrong ones
create policy "super admin removes member roles"
  on public.member_roles for delete to authenticated
  using ((select private.is_super_admin()));

insert into public.member_roles (name) values ('Intern'), ('Fellow'), ('Volunteer')
on conflict do nothing;

-- roles members already saved (spaces tidied, over-long ones skipped)
insert into public.member_roles (name)
select min(regexp_replace(btrim(role), '\s+', ' ', 'g'))
from public.profiles
where char_length(regexp_replace(btrim(role), '\s+', ' ', 'g')) between 1 and 40
group by lower(regexp_replace(btrim(role), '\s+', ' ', 'g'))
on conflict do nothing;

-- before saving: tidy the spaces, refuse a role that is too long, use the listed spelling if there is one
create or replace function private.clean_role()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  r text := regexp_replace(btrim(coalesce(new.role, '')), '\s+', ' ', 'g');
  listed text;
begin
  if char_length(r) > 40 then
    raise exception 'Role must be 40 characters or less.';
  end if;
  select name into listed from public.member_roles where lower(btrim(name)) = lower(r);
  new.role := coalesce(listed, r);
  return new;
end;
$$;

drop trigger if exists on_profile_role_clean on public.profiles;
create trigger on_profile_role_clean
  before insert or update of role on public.profiles
  for each row execute function private.clean_role();

-- after saving: a role that is not on the list yet is added for everyone
create or replace function private.track_role()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.role <> '' and not exists (select 1 from public.member_roles where lower(btrim(name)) = lower(new.role)) then
    insert into public.member_roles (name, added_by) values (new.role, new.id) on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_role_track on public.profiles;
create trigger on_profile_role_track
  after insert or update of role on public.profiles
  for each row execute function private.track_role();
