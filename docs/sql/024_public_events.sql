-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Needs 001-022 (022 defines private.profile_complete).
-- Public events: admins can mark an event as public so every signed-in member sees it on their calendar.
-- Private events (the default) stay visible only to their owner, as before.
-- Only admins can create a public event. Only the owner can edit or delete an event.

alter table public.events
  add column if not exists is_public boolean not null default false;

create index if not exists events_public_date_idx on public.events (date, time) where is_public;

-- everyone sees their own events and every public event
alter policy "see own events" on public.events
  using ((select auth.uid()) = user_id or is_public);

-- creating / editing a public event needs admin rights (plus the complete-profile gate from 022)
alter policy "add own events" on public.events
  with check (
    (select auth.uid()) = user_id
    and (select private.profile_complete((select auth.uid())))
    and (not is_public or (select private.is_admin()))
  );
alter policy "edit own events" on public.events
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (select private.profile_complete((select auth.uid())))
    and (not is_public or (select private.is_admin()))
  );
