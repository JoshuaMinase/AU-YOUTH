-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- News + article pages and the home "Latest announcement" card.
-- Everyone signed in reads published articles; only editors write.

-- Editors are added by hand in the Supabase dashboard (Table Editor -> editors -> Insert row).
-- This is a separate table on purpose: members can edit their own profiles row, so a flag there
-- would let anyone make themselves an editor.
create schema if not exists private;

create table if not exists public.editors (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.editors enable row level security;

-- lets the app know whether to show editor controls (no insert/update/delete policies)
create policy "see own editor row"
  on public.editors for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function private.is_editor()
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (select 1 from public.editors where user_id = (select auth.uid()));
$$;

revoke execute on function private.is_editor() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_editor() to authenticated;

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- the chip label ('Initiative', 'Event'…) is derived from cat in code
  cat text not null check (cat in ('Initiatives', 'Opportunities', 'Events', 'Partnerships', 'Announcements', 'Development')),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  excerpt text not null default '' check (char_length(excerpt) <= 400),
  body text[] not null default '{}',
  source text not null default 'AU Commission' check (char_length(source) <= 60),
  img text not null default '/assets/card-img-1.webp',
  -- the featured article is the news hero and the home "Latest announcement" card
  featured boolean not null default false,
  author_id uuid default auth.uid() references public.profiles (id) on delete set null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists news_published_idx on public.news (published_at desc);
create index if not exists news_author_idx on public.news (author_id);
-- at most one featured article
create unique index if not exists news_one_featured_idx on public.news ((true)) where featured;

alter table public.news enable row level security;

-- scheduled articles (published_at in the future) stay hidden until then, except to editors
create policy "read published news"
  on public.news for select to authenticated
  using (published_at <= now() or (select private.is_editor()));

create policy "editors add news"
  on public.news for insert to authenticated
  with check ((select private.is_editor()));

create policy "editors edit news"
  on public.news for update to authenticated
  using ((select private.is_editor())) with check ((select private.is_editor()));

create policy "editors delete news"
  on public.news for delete to authenticated
  using ((select private.is_editor()));

alter publication supabase_realtime add table public.news;

-- Seed: the six articles currently in lib/data.ts (placeholders, as in the demo).
insert into public.news (slug, cat, featured, title, excerpt, body, source, img, author_id, published_at) values
  ('youth-engagement-framework', 'Initiatives', true,
   'AU launches new Youth Engagement Framework for 2026–2030',
   'The African Union Commission has unveiled an ambitious five-year strategy to deepen youth participation across all member states and institutional bodies.',
   array[
     'The framework sets out how young people will be consulted on continental policy, from early drafting through to implementation reviews.',
     'Interns, volunteers and fellows will be able to contribute through structured working groups, with quarterly sessions hosted both online and at the AU headquarters in Addis Ababa.',
     'Departments are asked to nominate a youth focal point before the end of the quarter, so that every programme has a clear contact for the network.'
   ], 'AU Commission', '/assets/card-img-1.webp', null, now() - interval '2 hours'),
  ('volunteer-programme-cohort-7', 'Opportunities', false,
   'Applications open: AU Youth Volunteer Programme — Cohort 7',
   'Young professionals from across the continent are invited to apply for a six-month volunteer placement at the AU headquarters in Addis Ababa.',
   array[
     'Cohort 7 placements cover policy, communications, data and operations roles across eight departments.',
     'Applicants should be between 21 and 35, hold a degree or equivalent experience, and be a citizen of an AU member state.',
     'Shortlisted candidates will be invited to a short online interview before final selection.'
   ], 'Political Affairs', '/assets/card-img-2.webp', null, now() - interval '1 day'),
  ('youth-innovation-summit', 'Events', false,
   'Pan-African Youth Innovation Summit to be held in Addis Ababa',
   'The annual summit convenes over 500 young innovators, entrepreneurs and policy makers from 55 member states.',
   array[
     'This year’s summit focuses on digital public infrastructure, climate resilience and youth-led enterprise.',
     'Members of the network can register for a limited number of delegate places through the portal.'
   ], 'HRST Department', '/assets/card-img-3.webp', null, now() - interval '3 days'),
  ('skills-programme-10000', 'Development', false,
   'New skills programme targets 10,000 young professionals across member states',
   'A joint initiative between the AU and key continental partners will provide digital and vocational training to youth across all regions.',
   array[
     'Tracks include data analysis, project management, public speaking and policy writing.',
     'Courses are self-paced, with live mentorship sessions every fortnight.'
   ], 'AU Commission', '/assets/card-img-4.webp', null, now() - interval '4 days'),
  ('au-afdb-youth-employment', 'Partnerships', false,
   'AU and AfDB deepen cooperation on youth employment and entrepreneurship',
   'The two continental institutions have signed a memorandum of understanding to co-fund youth-led businesses and employment hubs.',
   array[
     'The agreement will fund incubation hubs in each of the five AU regions.',
     'Network members will be among the first invited to apply for mentorship and seed funding rounds.'
   ], 'Economic Affairs', '/assets/card-img-1.webp', null, now() - interval '5 days'),
  ('intern-coordination-meeting', 'Announcements', false,
   'Quarterly intern coordination meeting — agenda and venue confirmed',
   'All active interns and fellows are requested to attend the upcoming coordination session in Mandela Hall.',
   array[
     'The agenda covers onboarding feedback, project matching and the upcoming Leadership Forum.',
     'Please bring your updated work plan and confirm attendance with your cohort lead.'
   ], 'Protocol Office', '/assets/card-img-2.webp', null, now() - interval '6 days')
on conflict (slug) do nothing;
