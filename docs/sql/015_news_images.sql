-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Photos for news articles: admins upload from the New/Edit article form, everyone can see them.
-- The browser shrinks every photo to 1600px wide WebP before uploading, so files stay small.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('news-images', 'news-images', true, 3145728, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- the bucket is public, so photos load by their URL without a read policy;
-- only admins (and the super admin) can add or remove files
create policy "admins upload news images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'news-images' and (select private.is_admin()));

create policy "admins delete news images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'news-images' and (select private.is_admin()));
