-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Turns on live updates for connection requests and new members.
alter publication supabase_realtime add table public.connections;
alter publication supabase_realtime add table public.profiles;
