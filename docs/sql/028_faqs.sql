-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Needs 013. FAQs on the Get Help page now live in the database instead of the code.
-- Everyone signed in can read them; any admin (or the super admin) can add, edit and delete them from the Get Help page.
-- No sample rows on purpose: the admins add the real questions.

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(btrim(question)) between 1 and 200),
  answer text not null check (char_length(btrim(answer)) between 1 and 1500),
  position integer not null default 0,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists faqs_position_idx on public.faqs (position, created_at);
create index if not exists faqs_created_by_idx on public.faqs (created_by);

alter table public.faqs enable row level security;

create policy "read faqs"
  on public.faqs for select to authenticated using (true);

create policy "admins add faqs"
  on public.faqs for insert to authenticated
  with check ((select private.is_admin()));

create policy "admins edit faqs"
  on public.faqs for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "admins delete faqs"
  on public.faqs for delete to authenticated
  using ((select private.is_admin()));
