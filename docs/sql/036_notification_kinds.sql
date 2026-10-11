-- 036: repair + guard for the notification kinds. Run in the Supabase SQL Editor. Safe to run any number of times.
-- Every older SQL file used to REWRITE the whole list of allowed notification kinds. Re-running an old one (029, say)
-- dropped chat_message, opportunity and reminder, and sending to a group chat then failed.
-- Those files now use private.allow_notification_kinds(), which only ever ADDS kinds. Run this file once to:
--   * put back any kind an earlier re-run removed, and
--   * install the helper in the database.
-- NEW KINDS: add them with `select private.allow_notification_kinds(array['my_new_kind']);` in the new SQL file.
-- Never write a `check (kind in (...))` list by hand again.

-- Adds notification kinds and NEVER removes one: it reads the kinds the constraint already allows and keeps them.
-- So re-running an older SQL file can no longer break newer kinds (chat_message, opportunity, reminder, ...).
create schema if not exists private;

create or replace function private.allow_notification_kinds(add_kinds text[])
returns void
language plpgsql
set search_path = ''
as $fn$
declare
  old_kinds text[];
  all_kinds text[];
begin
  select coalesce(array_agg(m[1]), '{}') into old_kinds
  from pg_constraint c
  cross join lateral regexp_matches(pg_get_constraintdef(c.oid), '''([a-z_]+)''', 'g') as m
  where c.conrelid = 'public.notifications'::regclass and c.conname = 'notifications_kind_check';

  select array_agg(distinct k order by k) into all_kinds from unnest(old_kinds || add_kinds) as k;

  alter table public.notifications drop constraint if exists notifications_kind_check;
  -- written as kind in ('a', 'b', ...) so every kind stays a separate quoted word that the next run can read back
  execute 'alter table public.notifications add constraint notifications_kind_check check (kind in ('
    || (select string_agg(quote_literal(k), ', ' order by k) from unnest(all_kinds) as k) || '))';
end;
$fn$;

select private.allow_notification_kinds(array[
  'connection_request', 'connection_accepted', 'post_comment', 'news', 'delete_request', 'new_department',
  'flagged_message', 'ticket', 'chat_message', 'opportunity', 'reminder'
]);
