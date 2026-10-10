-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- The group every member joins is for all AU Youth, not only interns. Renames it (found by its slug, so nothing else changes).
update public.conversations set title = 'AU Youth Community' where slug = 'community' and title = 'AU Intern Community';
