-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Needs 001 and 009 (the private schema). No app change needed for the hiding itself.
-- Only members who confirmed their email show up for other people (People page, chat members, feed authors, Admin lists).
--   * Sign-up creates the profile row straight away (handle_new_user in 001), before the email code is entered.
--     Until now those unconfirmed accounts were visible and could even be sent a connection request.
--   * "Verified" = auth.users.email_confirmed_at is set.
--   * You always see your own profile, whatever its state.
-- To undo: alter policy "profiles are readable by signed-in users" on public.profiles using (true);

create or replace function private.is_verified(uid uuid)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from auth.users u
    where u.id = uid and u.email_confirmed_at is not null
  );
$$;

grant execute on function private.is_verified(uuid) to authenticated;

alter policy "profiles are readable by signed-in users" on public.profiles
  using ((select auth.uid()) = id or private.is_verified(id));

-- Tidy up: connection requests that involve a member who is still unverified
-- (they could not have been sent by someone who cannot sign in, but a request TO them may exist).
delete from public.connections c
where c.status = 'pending'
  and (not private.is_verified(c.requester_id) or not private.is_verified(c.addressee_id));

-- check: how many accounts are hidden from the People page right now
select count(*) as hidden_unverified
from public.profiles p
where not private.is_verified(p.id);
