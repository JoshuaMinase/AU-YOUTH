-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Adds gender to profiles and saves it from the sign-up form.
-- Nothing is deleted: the university, degree and study_year columns stay in the database
-- (the app just no longer shows or writes them).

alter table public.profiles
  add column if not exists gender text not null default '';

alter table public.profiles drop constraint if exists profiles_gender_check;
alter table public.profiles add constraint profiles_gender_check
  check (gender in ('', 'female', 'male', 'prefer_not_to_say'));

-- same function as 001, now also reading gender from the sign-up form
-- (anything that is not one of the allowed values is saved as empty, so sign-up can never fail on it)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  g text := coalesce(new.raw_user_meta_data ->> 'gender', '');
begin
  insert into public.profiles (id, first_name, last_name, gender)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    case when g in ('female', 'male', 'prefer_not_to_say') then g else '' end
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
