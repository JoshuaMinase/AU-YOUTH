-- 034: chat paging. Run in the Supabase SQL Editor BEFORE pushing the app update.
-- The app now loads only the newest 30 messages of each chat (older ones on request), so the unread
-- count can no longer be worked out from the loaded messages. This function counts it in the database.
-- security invoker: row level security still applies, so you only count messages in chats you can see.
-- Safe to run more than once.

create or replace function public.chat_unread_counts(conv uuid default null)
returns table (conversation_id uuid, unread bigint)
language sql stable
security invoker set search_path = ''
as $$
  select m.conversation_id, count(*)::bigint
  from public.messages m
  join public.conversation_members cm
    on cm.conversation_id = m.conversation_id and cm.user_id = (select auth.uid())
  where m.sender_id is distinct from (select auth.uid())
    and m.created_at > cm.last_read_at
    and (conv is null or m.conversation_id = conv)
  group by m.conversation_id;
$$;

revoke execute on function public.chat_unread_counts(uuid) from public, anon;
grant execute on function public.chat_unread_counts(uuid) to authenticated;

-- messages_conversation_idx (conversation_id, created_at) from 011 already serves both the
-- "newest 30" and the "30 before this one" queries, so no new index is needed.
