-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Signed-in members can see all profiles (for the People page)...
create policy "profiles are readable by signed-in users"
  on public.profiles for select to authenticated using (true);

-- ...but can only edit their own.
create policy "users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- Create a profile row automatically on sign-up (names come from sign-up metadata).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
