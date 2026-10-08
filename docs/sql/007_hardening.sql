-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Fixes from the Supabase advisors. No change in what the app can do.

-- handle_new_user only runs as a trigger; nobody should call it through /rest/v1/rpc.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- connections: index each side of the pair (People page looks up by either person)
create index if not exists connections_requester_idx on public.connections (requester_id);
create index if not exists connections_addressee_idx on public.connections (addressee_id);

-- RLS: work out auth.uid() once per query instead of once per row
alter policy "users update own profile" on public.profiles
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
alter policy "users insert own profile" on public.profiles
  with check ((select auth.uid()) = id);

alter policy "see own connections" on public.connections
  using ((select auth.uid()) in (requester_id, addressee_id));
alter policy "send connection request" on public.connections
  with check ((select auth.uid()) = requester_id and status = 'pending');
alter policy "accept connection request" on public.connections
  using ((select auth.uid()) = addressee_id)
  with check ((select auth.uid()) = addressee_id and status = 'accepted');
alter policy "remove own connection" on public.connections
  using ((select auth.uid()) in (requester_id, addressee_id));

alter policy "see own events" on public.events using ((select auth.uid()) = user_id);
alter policy "add own events" on public.events with check ((select auth.uid()) = user_id);
alter policy "edit own events" on public.events
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "delete own events" on public.events using ((select auth.uid()) = user_id);
