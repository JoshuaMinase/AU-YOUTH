-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Needs 006 and 024. Richer calendar events: an optional last day (multi-day events such as 3-6 Nov),
-- a description, and up to 3 photos. Single-day events keep working exactly as before (end_date is null).

alter table public.events
  add column if not exists end_date date,
  add column if not exists description text not null default '',
  add column if not exists images text[] not null default '{}';

alter table public.events drop constraint if exists events_end_date_check;
alter table public.events add constraint events_end_date_check
  check (end_date is null or (end_date >= date and end_date <= date + 90));
alter table public.events drop constraint if exists events_description_check;
alter table public.events add constraint events_description_check
  check (char_length(description) <= 1000);
alter table public.events drop constraint if exists events_images_check;
alter table public.events add constraint events_images_check
  check (coalesce(array_length(images, 1), 0) <= 3);

-- photos: public bucket (like news-images, so photos load by their URL; the file names are random).
-- Any member can upload, and can delete only the files they uploaded. 3 MB each; the browser shrinks them first.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-images', 'event-images', true, 3145728, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

drop policy if exists "members upload event images" on storage.objects;
create policy "members upload event images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'event-images');

drop policy if exists "owners delete event images" on storage.objects;
create policy "owners delete event images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'event-images' and owner_id = (select auth.uid())::text);
