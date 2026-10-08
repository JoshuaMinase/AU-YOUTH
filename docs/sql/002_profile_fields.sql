-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Adds the editable profile fields and lets a member create their own row if it is missing.

alter table public.profiles
  add column if not exists role text not null default '',
  add column if not exists dept text not null default '',
  add column if not exists bio text not null default '',
  add column if not exists nationality text not null default '',
  add column if not exists based_in text not null default '',
  add column if not exists start_date text not null default '',
  add column if not exists end_date text not null default '',
  add column if not exists university text not null default '',
  add column if not exists degree text not null default '',
  add column if not exists study_year text not null default '',
  add column if not exists skills text[] not null default '{}';

create policy "users insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);
