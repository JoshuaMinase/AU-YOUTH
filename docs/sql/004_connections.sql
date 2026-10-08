-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);

-- one connection per pair of people, whichever direction it was requested in
create unique index if not exists connections_pair_idx
  on public.connections (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

alter table public.connections enable row level security;

-- you can see connections you are part of
create policy "see own connections"
  on public.connections for select to authenticated
  using (auth.uid() in (requester_id, addressee_id));

-- you can send a request as yourself
create policy "send connection request"
  on public.connections for insert to authenticated
  with check (auth.uid() = requester_id and status = 'pending');

-- only the person who received the request can accept it
create policy "accept connection request"
  on public.connections for update to authenticated
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id and status = 'accepted');

-- either person can withdraw, decline or remove
create policy "remove own connection"
  on public.connections for delete to authenticated
  using (auth.uid() in (requester_id, addressee_id));
