-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Needs 008, 009, 010. Replaces "editors" with a hierarchy:
--   super admin (exactly one) -> admins (chosen by the super admin) -> users -> visitors (public site only).
-- Sign-up is limited to AU email domains.

create schema if not exists private;

-- ── who is admin ─────────────────────────────────────────────────────
create table if not exists public.admins (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'super_admin')),
  granted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- only one super admin, ever at a time
create unique index if not exists admins_one_super_idx on public.admins ((true)) where role = 'super_admin';
create index if not exists admins_granted_by_idx on public.admins (granted_by);

alter table public.admins enable row level security;

-- everyone signed in can see who the admins are (badges on People); changes only through set_admin()
create policy "read admins"
  on public.admins for select to authenticated using (true);

create or replace function private.is_admin()
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

create or replace function private.is_super_admin()
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()) and role = 'super_admin');
$$;

revoke execute on function private.is_admin() from public, anon;
revoke execute on function private.is_super_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_super_admin() to authenticated;

-- super admin makes someone an admin (make = true) or removes them (make = false)
create or replace function public.set_admin(target uuid, make boolean)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not private.is_super_admin() then
    raise exception 'only the super admin can change admins';
  end if;
  if target is null or target = auth.uid() then
    raise exception 'invalid member';
  end if;
  if make then
    insert into public.admins (user_id, role, granted_by) values (target, 'admin', auth.uid())
    on conflict (user_id) do nothing;
  else
    delete from public.admins where user_id = target and role = 'admin';
  end if;
end;
$$;

revoke execute on function public.set_admin(uuid, boolean) from public, anon;
grant execute on function public.set_admin(uuid, boolean) to authenticated;

-- ── the super admin ──────────────────────────────────────────────────
-- ZemenA@africanunion.org becomes super admin as soon as that account exists (now, or on sign-up).
-- To hand over later: update public.admins set role = 'admin' where role = 'super_admin';
-- then insert / update the new person's row with role = 'super_admin'.
create or replace function private.grant_super_admin()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if exists (select 1 from auth.users where id = new.id and lower(email) = 'zemena@africanunion.org')
     and not exists (select 1 from public.admins where role = 'super_admin') then
    insert into public.admins (user_id, role) values (new.id, 'super_admin')
    on conflict (user_id) do update set role = 'super_admin';
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_grant_super_admin on public.profiles;
create trigger on_profile_grant_super_admin
  after insert on public.profiles
  for each row execute function private.grant_super_admin();

insert into public.admins (user_id, role)
select p.id, 'super_admin' from public.profiles p join auth.users u on u.id = p.id
where lower(u.email) = 'zemena@africanunion.org'
on conflict (user_id) do nothing;

-- ── move every "editor" policy over to admins ────────────────────────
alter policy "read published news" on public.news
  using (published_at <= now() or (select private.is_admin()));
alter policy "editors add news" on public.news with check ((select private.is_admin()));
alter policy "editors edit news" on public.news
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "editors delete news" on public.news using ((select private.is_admin()));
alter policy "editors add news" on public.news rename to "admins add news";
alter policy "editors edit news" on public.news rename to "admins edit news";
alter policy "editors delete news" on public.news rename to "admins delete news";

alter policy "write own post" on public.posts
  with check (
    (select auth.uid()) = author_id
    and ((not as_org and not pinned) or (select private.is_admin()))
  );
alter policy "delete own post" on public.posts
  using ((select auth.uid()) = author_id or (select private.is_admin()));
alter policy "delete own comment" on public.post_comments
  using ((select auth.uid()) = author_id or (select private.is_admin()));

drop function if exists private.is_editor();
drop table if exists public.editors;

-- ── admins handle support tickets ────────────────────────────────────
create policy "admins read tickets"
  on public.support_tickets for select to authenticated
  using ((select private.is_admin()));

create policy "admins update tickets"
  on public.support_tickets for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

revoke update on public.support_tickets from authenticated;
grant update (status) on public.support_tickets to authenticated;

-- ── visitors can't sign up: AU email domains only ────────────────────
create or replace function private.check_email_domain()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if lower(split_part(coalesce(new.email, ''), '@', 2)) not in ('africanunion.org', 'africa-union.org') then
    raise exception 'Sign-up is only open to @africanunion.org and @africa-union.org email addresses';
  end if;
  return new;
end;
$$;

drop trigger if exists check_email_domain on auth.users;
create trigger check_email_domain
  before insert or update of email on auth.users
  for each row execute function private.check_email_domain();
