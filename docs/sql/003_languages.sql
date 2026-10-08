-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
alter table public.profiles
  add column if not exists languages text[] not null default '{}';
