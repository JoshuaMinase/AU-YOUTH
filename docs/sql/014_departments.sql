-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Needs 012 and 013. Department pick-list for the profile form.
-- A department a member types that isn't on the list is added for everyone, and the super admin is told.

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) >= 1),
  added_by uuid references public.profiles (id) on delete set null,  -- null = from the official list
  created_at timestamptz not null default now()
);

create unique index if not exists departments_name_idx on public.departments (lower(btrim(name)));
create index if not exists departments_added_by_idx on public.departments (added_by);

alter table public.departments enable row level security;

create policy "read departments"
  on public.departments for select to authenticated using (true);

-- new names arrive only through the profile trigger below; the super admin can remove wrong ones
create policy "super admin removes departments"
  on public.departments for delete to authenticated
  using ((select private.is_super_admin()));

insert into public.departments (name) values
  ('Cabinet of the Chairperson (CCP)'),
  ('Cabinet of the Deputy Chairperson (CDCP)'),
  ('Agriculture, Rural Development, Blue Economy, and Sustainable Environment (ARBE)'),
  ('Education, Science, Technology and Innovation (ESTI)'),
  ('Infrastructure and Energy'),
  ('Political Affairs, Peace and Security (PAPS)'),
  ('Health, Humanitarian Affairs and Social Development (HHS)'),
  ('Administration & Human Resources'),
  ('Citizens & Diaspora'),
  ('Conference Management and Publications'),
  ('Internal Audit'),
  ('Information and Communication'),
  ('Legal Counsel'),
  ('Medical and Health Services'),
  ('Programming, Budget, Finance & Accounting'),
  ('Protocol Services'),
  ('Strategic Planning'),
  ('Peace Fund Secretariat'),
  ('Women, Gender & Development'),
  ('Partnerships Management and Resource Mobilisation'),
  ('Intelligence and Security Committee'),
  ('NEPAD Coordination Unit'),
  ('MIS')
on conflict do nothing;

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('connection_request', 'connection_accepted', 'post_comment', 'news', 'delete_request', 'new_department'));

create or replace function private.track_department()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  d text := btrim(coalesce(new.dept, ''));
begin
  if d <> '' and not exists (select 1 from public.departments where lower(btrim(name)) = lower(d)) then
    insert into public.departments (name, added_by) values (d, new.id) on conflict do nothing;
    insert into public.notifications (user_id, kind, title, body, href)
    select user_id, 'new_department', 'New department added',
           private.display_name(new.id) || ' added "' || left(d, 120) || '" to the department list.', '/dashboard/people'
    from public.admins
    where role = 'super_admin' and user_id <> new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_department on public.profiles;
create trigger on_profile_department
  after insert or update of dept on public.profiles
  for each row execute function private.track_department();
