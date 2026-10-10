-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Needs 001-021. Incomplete profiles become view-only: members can read news, people and the feed,
-- but cannot post, comment, like, add or edit events, send connection requests, accept them or send chat messages
-- until the required profile fields are filled in. Admins and the super admin are never locked (the app only reminds them to finish their profile).
-- The bio is optional. Keep the field list in sync with profileMissing() in lib/data.ts.

create or replace function private.profile_complete(uid uuid)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select private.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = uid
        and btrim(coalesce(p.role, '')) <> ''
        and btrim(coalesce(p.dept, '')) <> ''
        and btrim(coalesce(p.nationality, '')) <> ''
        and btrim(coalesce(p.based_in, '')) <> ''
        and coalesce(p.gender, '') <> ''
        and coalesce(array_length(p.skills, 1), 0) >= 1
    );
$$;

-- events
alter policy "add own events" on public.events
  with check ((select auth.uid()) = user_id and (select private.profile_complete((select auth.uid()))));
alter policy "edit own events" on public.events
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and (select private.profile_complete((select auth.uid()))));

-- connections
alter policy "send connection request" on public.connections
  with check ((select auth.uid()) = requester_id and status = 'pending'
    and (select private.profile_complete((select auth.uid()))));
alter policy "accept connection request" on public.connections
  using ((select auth.uid()) = addressee_id)
  with check ((select auth.uid()) = addressee_id and status = 'accepted'
    and (select private.profile_complete((select auth.uid()))));

-- feed (posts are admin-only already; likes and comments need a complete profile)
alter policy "like as yourself" on public.post_likes
  with check ((select auth.uid()) = user_id and (select private.profile_complete((select auth.uid()))));
alter policy "comment as yourself" on public.post_comments
  with check ((select auth.uid()) = author_id and (select private.profile_complete((select auth.uid()))));

-- chat messages
alter policy "send message as yourself" on public.messages
  with check ((select auth.uid()) = sender_id and private.is_member(conversation_id)
    and (select private.profile_complete((select auth.uid()))));

grant execute on function private.profile_complete(uuid) to authenticated;
