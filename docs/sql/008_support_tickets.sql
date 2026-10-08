-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Get Help -> "Report an issue". Members file and see their own reports;
-- the platform team reads them in the Supabase dashboard (Table Editor).

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  area text not null check (area in ('Dashboard', 'Chats', 'Calendar', 'People', 'News', 'Account & login', 'Other')),
  urgency text not null default 'Normal' check (urgency in ('Low', 'Normal', 'High')),
  description text not null check (char_length(btrim(description)) between 10 and 2000),
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists support_tickets_user_idx on public.support_tickets (user_id, created_at desc);

alter table public.support_tickets enable row level security;

create policy "see own tickets"
  on public.support_tickets for select to authenticated
  using ((select auth.uid()) = user_id);

-- new tickets always start as open; only the team changes the status
create policy "file own ticket"
  on public.support_tickets for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'open');
