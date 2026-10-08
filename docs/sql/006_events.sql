-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Calendar events: each member only sees and edits their own.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  date date not null,
  time time not null default '10:00',
  type text not null default 'meeting' check (type in ('meeting', 'event', 'workshop', 'session', 'call', 'forum')),
  location text not null default 'TBC' check (char_length(location) <= 60),
  created_at timestamptz not null default now()
);

create index if not exists events_user_date_idx on public.events (user_id, date, time);

alter table public.events enable row level security;

create policy "see own events"
  on public.events for select to authenticated
  using (auth.uid() = user_id);

create policy "add own events"
  on public.events for insert to authenticated
  with check (auth.uid() = user_id);

create policy "edit own events"
  on public.events for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own events"
  on public.events for delete to authenticated
  using (auth.uid() = user_id);

-- live updates (a second tab or device sees changes straight away)
alter publication supabase_realtime add table public.events;
