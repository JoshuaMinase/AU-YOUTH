-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Needs 009 (private.is_editor). Dashboard home feed: posts, likes, comments, hidden posts.

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  -- editors can post as "AU Youth Network" and pin a post to the top
  as_org boolean not null default false,
  pinned boolean not null default false,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  -- no uploads yet: only images already in /public/assets
  image text check (image is null or image like '/assets/%'),
  created_at timestamptz not null default now()
);

create index if not exists posts_feed_idx on public.posts (pinned desc, created_at desc);
create index if not exists posts_author_idx on public.posts (author_id);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_likes_user_idx on public.post_likes (user_id);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists post_comments_post_idx on public.post_comments (post_id, created_at);
create index if not exists post_comments_author_idx on public.post_comments (author_id);

-- "Hide post" is personal: only you see what you hid
create table if not exists public.post_hides (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index if not exists post_hides_post_idx on public.post_hides (post_id);

alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_hides enable row level security;

-- posts
create policy "read posts"
  on public.posts for select to authenticated using (true);

create policy "write own post"
  on public.posts for insert to authenticated
  with check (
    (select auth.uid()) = author_id
    and ((not as_org and not pinned) or (select private.is_editor()))
  );

create policy "delete own post"
  on public.posts for delete to authenticated
  using ((select auth.uid()) = author_id or (select private.is_editor()));

-- likes (readable by all, so counts work)
create policy "read likes"
  on public.post_likes for select to authenticated using (true);

create policy "like as yourself"
  on public.post_likes for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "unlike own"
  on public.post_likes for delete to authenticated
  using ((select auth.uid()) = user_id);

-- comments
create policy "read comments"
  on public.post_comments for select to authenticated using (true);

create policy "comment as yourself"
  on public.post_comments for insert to authenticated
  with check ((select auth.uid()) = author_id);

create policy "delete own comment"
  on public.post_comments for delete to authenticated
  using ((select auth.uid()) = author_id or (select private.is_editor()));

-- hidden posts
create policy "see own hidden posts"
  on public.post_hides for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "hide a post"
  on public.post_hides for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "unhide a post"
  on public.post_hides for delete to authenticated
  using ((select auth.uid()) = user_id);

alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.post_likes;
alter publication supabase_realtime add table public.post_comments;

-- Optional seed, once an editor exists (009): the pinned welcome post from the demo.
-- insert into public.posts (author_id, as_org, pinned, body, image)
-- select user_id, true, true,
--   '🎉 Welcome to Intern Onboarding Week! Make sure to complete your profile so coordinators can match you to the right projects. Reach out to your cohort lead if you have any questions.',
--   '/assets/card-img-1.webp'
-- from public.editors limit 1;
