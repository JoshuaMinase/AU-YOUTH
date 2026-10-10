-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Needs 001-028 run in order (it uses 011 chats, 013 roles, 014 departments, 017 department chats, 022 profile gate, 023 chat media).
--
-- Get Help -> "Report an issue" becomes an internal ticket for the organisation:
--   1. A member files a ticket and picks the department that should fix it, or leaves it to the admins.
--   2. With a department: the ticket (with an ID such as T-0012) appears as a card in that department's group chat.
--      Without one: every admin is told, and an admin picks the department from the Admin panel (then the card appears).
--   3. Any member of that department chat can take it. A temporary chat opens between the reporter and that person.
--   4. Each of them marks the ticket resolved. When both have, the ticket is closed and the chat is open for 24 more hours,
--      then it disappears for both of them.
--   5. Admins can still read a ticket chat afterwards (and while it runs) from the Admin panel, read-only and logged,
--      in case someone is harassed. It is one collapsed search box there, not a list that grows.
-- Tickets are now created and changed only through the functions below.

create schema if not exists private;

-- ── 1) tickets: new columns ──────────────────────────────────────────
alter table public.support_tickets add column if not exists ticket_no bigint generated always as identity;
create unique index if not exists support_tickets_no_idx on public.support_tickets (ticket_no);

alter table public.support_tickets add column if not exists title text;
alter table public.support_tickets add column if not exists dept_id uuid references public.departments (id) on delete set null;  -- null = the admins decide
alter table public.support_tickets add column if not exists assignee_id uuid references public.profiles (id) on delete set null;
alter table public.support_tickets add column if not exists claimed_at timestamptz;
alter table public.support_tickets add column if not exists reporter_resolved_at timestamptz;
alter table public.support_tickets add column if not exists assignee_resolved_at timestamptz;
alter table public.support_tickets add column if not exists closed_at timestamptz;

create index if not exists support_tickets_dept_idx on public.support_tickets (dept_id);
create index if not exists support_tickets_assignee_idx on public.support_tickets (assignee_id);

-- the old platform "Area" list is gone; new tickets use a title instead (old rows keep their area)
alter table public.support_tickets alter column area drop not null;
alter table public.support_tickets drop constraint if exists support_tickets_area_check;
alter table public.support_tickets drop constraint if exists support_tickets_title_check;
alter table public.support_tickets add constraint support_tickets_title_check
  check (title is null or char_length(btrim(title)) between 3 and 80);

-- ── 2) conversations: a ticket chat belongs to one ticket and can expire ─
alter table public.conversations add column if not exists ticket_id uuid unique references public.support_tickets (id) on delete cascade;
alter table public.conversations add column if not exists expires_at timestamptz;  -- set when the ticket closes (+24 hours)

-- ── 3) messages: a "ticket" card posted in the department chat ───────
alter table public.messages add column if not exists ticket_id uuid references public.support_tickets (id) on delete cascade;
create index if not exists messages_ticket_idx on public.messages (ticket_id);

alter table public.messages drop constraint if exists messages_kind_check;
alter table public.messages add constraint messages_kind_check
  check (kind in ('text', 'image', 'file', 'voice', 'ticket'));

alter table public.messages drop constraint if exists messages_content_check;
alter table public.messages add constraint messages_content_check check (
  char_length(body) <= 2000 and (
    (kind = 'text' and attachment_path is null and ticket_id is null and char_length(btrim(body)) >= 1)
    or (kind in ('image', 'file', 'voice')
        and ticket_id is null
        and attachment_path is not null
        and starts_with(attachment_path, conversation_id::text || '/')
        and attachment_name is not null)
    or (kind = 'ticket' and ticket_id is not null and attachment_path is null and char_length(btrim(body)) >= 1)
  )
);

-- ── 4) a chat is closed to everyone once it has expired ──────────────
-- is_member() is what every chat policy (messages, members, chat files) asks, so one change here
-- hides an expired ticket chat everywhere: the list, the messages and the files.
create or replace function private.is_member(conv uuid)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.conversation_members m
    join public.conversations c on c.id = m.conversation_id
    where m.conversation_id = conv
      and m.user_id = (select auth.uid())
      and (c.expires_at is null or c.expires_at > now())
  );
$$;

create or replace function private.is_ticket_chat(conv uuid)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (select 1 from public.conversations where id = conv and ticket_id is not null);
$$;

-- is the signed-in member in the group chat of this department?
create or replace function private.in_dept_chat(dept uuid)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.conversations c
    join public.conversation_members m on m.conversation_id = c.id
    where c.dept_id = dept and m.user_id = (select auth.uid())
  );
$$;

create or replace function private.ticket_code(n bigint)
returns text
language sql immutable
set search_path = ''
as $$
  select 'T-' || case when length(n::text) >= 4 then n::text else lpad(n::text, 4, '0') end;
$$;

revoke execute on function private.is_ticket_chat(uuid) from public, anon;
revoke execute on function private.in_dept_chat(uuid) from public, anon;
revoke execute on function private.ticket_code(bigint) from public, anon;
grant execute on function private.is_ticket_chat(uuid) to authenticated;
grant execute on function private.in_dept_chat(uuid) to authenticated;
grant execute on function private.ticket_code(bigint) to authenticated;

-- ── 5) who may do what ───────────────────────────────────────────────
-- tickets: no more direct inserts or status changes; the functions below do it.
-- Read: your own (policy from 008), every admin (013), and now also the person helping and the department chat it was sent to.
drop policy if exists "file own ticket" on public.support_tickets;
drop policy if exists "admins update tickets" on public.support_tickets;
revoke insert on public.support_tickets from authenticated;
revoke update on public.support_tickets from authenticated;

drop policy if exists "department sees its tickets" on public.support_tickets;
create policy "department sees its tickets"
  on public.support_tickets for select to authenticated
  using (
    assignee_id = (select auth.uid())
    or (dept_id is not null and (select private.in_dept_chat(dept_id)))
  );

-- chat messages: nobody can type a ticket card themselves, and a ticket chat does not need a finished profile
-- (the person who reported a problem must be able to answer, even if their profile is incomplete)
alter policy "send message as yourself" on public.messages
  with check (
    (select auth.uid()) = sender_id
    and kind <> 'ticket'
    and private.is_member(conversation_id)
    and ((select private.profile_complete((select auth.uid()))) or private.is_ticket_chat(conversation_id))
  );

-- live updates when a ticket is taken or closed
alter publication supabase_realtime add table public.support_tickets;

-- notification kind for everything ticket related
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('connection_request', 'connection_accepted', 'post_comment', 'news', 'delete_request', 'new_department', 'flagged_message', 'ticket'));

-- ── 6) the admin's log of who opened which ticket chat ───────────────
create table if not exists public.ticket_chat_access (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles (id) on delete cascade,
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  viewed_at timestamptz not null default now()
);
create index if not exists ticket_chat_access_admin_idx on public.ticket_chat_access (admin_id);
create index if not exists ticket_chat_access_ticket_idx on public.ticket_chat_access (ticket_id, viewed_at desc);

alter table public.ticket_chat_access enable row level security;

-- rows are written only by read_ticket_chat(); only the super admin can read the log
drop policy if exists "super admin reads chat access log" on public.ticket_chat_access;
create policy "super admin reads chat access log"
  on public.ticket_chat_access for select to authenticated
  using ((select private.is_super_admin()));

-- ── 7) posting the ticket card in the department chat ────────────────
create or replace function private.post_ticket_card(t uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  tk public.support_tickets;
  conv uuid;
begin
  select * into tk from public.support_tickets where id = t;
  if not found or tk.dept_id is null then return; end if;
  select id into conv from public.conversations where dept_id = tk.dept_id;
  if conv is null then
    raise exception 'that department has no group chat yet';
  end if;
  -- the card is sent in the reporter's name; its text is only the summary shown in lists
  insert into public.messages (conversation_id, sender_id, body, kind, ticket_id)
  values (conv, tk.user_id,
          left(private.ticket_code(tk.ticket_no) || ' · ' || tk.urgency || ' urgency · ' || coalesce(tk.title, 'Issue'), 2000),
          'ticket', tk.id);
end;
$$;
revoke execute on function private.post_ticket_card(uuid) from public, anon, authenticated;

-- ── 8) file a ticket ─────────────────────────────────────────────────
-- p_dept = the department that should fix it, or null to let the admins decide. Returns the ticket id.
create or replace function public.create_ticket(p_title text, p_description text, p_urgency text, p_dept uuid)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  tk uuid;
  tno bigint;
  ttl text := btrim(coalesce(p_title, ''));
  descr text := btrim(coalesce(p_description, ''));
begin
  if me is null then raise exception 'please log in again'; end if;
  if char_length(ttl) not between 3 and 80 then raise exception 'the subject must be 3 to 80 characters'; end if;
  if char_length(descr) not between 10 and 2000 then raise exception 'describe the problem in 10 to 2000 characters'; end if;
  if p_urgency not in ('Low', 'Normal', 'High') then raise exception 'unknown urgency'; end if;
  if p_dept is not null and not exists (select 1 from public.departments where id = p_dept) then
    raise exception 'unknown department';
  end if;
  -- at most 10 tickets per member per hour, so the department chats cannot be flooded
  if (select count(*) from public.support_tickets where user_id = me and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'you have filed a lot of tickets just now, please try again later';
  end if;

  insert into public.support_tickets (user_id, title, description, urgency, dept_id)
  values (me, ttl, descr, p_urgency, p_dept)
  returning id, ticket_no into tk, tno;

  if p_dept is not null then
    perform private.post_ticket_card(tk);
  else
    insert into public.notifications (user_id, kind, title, body, href)
    select user_id, 'ticket', 'Ticket needs a department',
           private.ticket_code(tno) || ' · ' || left(ttl, 100) || ' (from ' || private.display_name(me) || ')',
           '/dashboard/admin'
    from public.admins
    where user_id <> me;
  end if;
  return tk;
end;
$$;

-- ── 9) an admin picks the department for a ticket nobody routed ──────
create or replace function public.route_ticket(t uuid, p_dept uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  tk public.support_tickets;
  dname text;
begin
  if not private.is_admin() then raise exception 'only admins can pick a department'; end if;
  select * into tk from public.support_tickets where id = t for update;
  if not found then raise exception 'ticket not found'; end if;
  if tk.dept_id is not null or tk.status <> 'open' then raise exception 'this ticket already has a department'; end if;
  select name into dname from public.departments where id = p_dept;
  if dname is null then raise exception 'unknown department'; end if;

  update public.support_tickets set dept_id = p_dept where id = t;
  perform private.post_ticket_card(t);

  if tk.user_id <> auth.uid() then
    insert into public.notifications (user_id, kind, title, body, href)
    values (tk.user_id, 'ticket', 'Your ticket was sent to ' || left(dname, 80),
            private.ticket_code(tk.ticket_no) || ' · ' || left(coalesce(tk.title, 'Issue'), 100), '/dashboard/get-help');
  end if;
end;
$$;

-- ── 10) someone in the department chat takes the ticket ──────────────
-- Opens the temporary chat for the reporter and the volunteer; returns the chat id.
create or replace function public.claim_ticket(t uuid)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  tk public.support_tickets;
  conv uuid;
begin
  if me is null then raise exception 'please log in again'; end if;
  select * into tk from public.support_tickets where id = t for update;   -- two people clicking at once: the second one waits, then is told
  if not found then raise exception 'ticket not found'; end if;
  if tk.dept_id is null or tk.status <> 'open' or tk.assignee_id is not null then
    raise exception 'someone has already taken this ticket';
  end if;
  if tk.user_id = me then raise exception 'you cannot take your own ticket'; end if;
  if not private.in_dept_chat(tk.dept_id) then
    raise exception 'only members of the department chat can take this ticket';
  end if;

  update public.support_tickets set assignee_id = me, status = 'in_progress', claimed_at = now() where id = t;

  insert into public.conversations (is_group, title, dm_key, ticket_id)
  values (false, left(private.ticket_code(tk.ticket_no) || ' · ' || coalesce(tk.title, 'Issue'), 200), 'ticket:' || t::text, t)
  returning id into conv;
  insert into public.conversation_members (conversation_id, user_id) values (conv, me), (conv, tk.user_id);

  insert into public.notifications (user_id, kind, title, body, href)
  values (tk.user_id, 'ticket', 'Your ticket was taken',
          private.display_name(me) || ' will help you with ' || private.ticket_code(tk.ticket_no) || '. A chat is open.',
          '/dashboard/chats?c=' || conv::text);
  return conv;
end;
$$;

-- ── 11) the reporter and the volunteer each mark it resolved ─────────
-- done = false takes your own mark back (until the ticket is closed). When both have marked it, the ticket closes
-- and the chat stays open for 24 more hours.
create or replace function public.resolve_ticket(t uuid, done boolean)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  tk public.support_tickets;
  other uuid;
  stamp timestamptz := case when done then now() else null end;
begin
  if me is null then raise exception 'please log in again'; end if;
  select * into tk from public.support_tickets where id = t for update;
  if not found then raise exception 'ticket not found'; end if;
  if tk.status = 'closed' then raise exception 'this ticket is already closed'; end if;
  if tk.status <> 'in_progress' then raise exception 'nobody is helping with this ticket yet'; end if;

  if me = tk.user_id then
    update public.support_tickets set reporter_resolved_at = stamp where id = t;
    other := tk.assignee_id;
  elsif me = tk.assignee_id then
    update public.support_tickets set assignee_resolved_at = stamp where id = t;
    other := tk.user_id;
  else
    raise exception 'only the person who reported it or the person helping can do this';
  end if;

  select * into tk from public.support_tickets where id = t;
  if tk.reporter_resolved_at is not null and tk.assignee_resolved_at is not null then
    update public.support_tickets set status = 'closed', closed_at = now() where id = t;
    update public.conversations set expires_at = now() + interval '24 hours' where ticket_id = t;
    if other is not null then
      insert into public.notifications (user_id, kind, title, body, href)
      values (other, 'ticket', private.ticket_code(tk.ticket_no) || ' is closed',
              'You both marked it resolved. The chat closes in 24 hours.', '/dashboard/chats?c=' || (select id::text from public.conversations where ticket_id = t));
    end if;
  elsif done and other is not null then
    insert into public.notifications (user_id, kind, title, body, href)
    values (other, 'ticket', private.display_name(me) || ' marked ' || private.ticket_code(tk.ticket_no) || ' as resolved',
            'If it is fixed, mark it resolved too to close the ticket.', '/dashboard/chats?c=' || (select id::text from public.conversations where ticket_id = t));
  end if;
end;
$$;

-- ── 12) admins: find and read a ticket chat ──────────────────────────
-- search: by ticket number (T-0012 or 12), title or a name; newest first, one page at a time
create or replace function public.search_ticket_chats(q text default '', lim int default 20, off int default 0)
returns table (t_id uuid, t_no bigint, t_title text, t_status text, t_dept text, t_reporter text, t_assignee text,
               t_created timestamptz, t_closed timestamptz, t_expires timestamptz, t_messages bigint)
language plpgsql stable
security definer set search_path = ''
as $$
declare
  term text := lower(btrim(coalesce(q, '')));
  digits text := left(regexp_replace(coalesce(q, ''), '\D', '', 'g'), 12);
begin
  if not private.is_admin() then raise exception 'only admins can search ticket chats'; end if;
  return query
  select tk.id, tk.ticket_no, coalesce(tk.title, tk.area, 'Issue'), tk.status, d.name,
         private.display_name(tk.user_id), private.display_name(tk.assignee_id),
         tk.created_at, tk.closed_at, c.expires_at,
         (select count(*) from public.messages m where m.conversation_id = c.id)
  from public.support_tickets tk
  join public.conversations c on c.ticket_id = tk.id
  left join public.departments d on d.id = tk.dept_id
  where term = ''
     or (digits <> '' and tk.ticket_no = digits::bigint)
     or strpos(lower(coalesce(tk.title, '')), term) > 0
     or strpos(lower(private.display_name(tk.user_id)), term) > 0
     or strpos(lower(coalesce(private.display_name(tk.assignee_id), '')), term) > 0
  order by tk.created_at desc
  limit least(greatest(lim, 1), 50) offset greatest(off, 0);
end;
$$;

-- read one ticket chat (read-only). Every opening is written to ticket_chat_access.
create or replace function public.read_ticket_chat(t uuid)
returns table (m_id uuid, m_sender_id uuid, m_sender text, m_body text, m_kind text, m_file text, m_at timestamptz)
language plpgsql
security definer set search_path = ''
as $$
begin
  if not private.is_admin() then raise exception 'only admins can read ticket chats'; end if;
  if not exists (select 1 from public.conversations where ticket_id = t) then raise exception 'this ticket has no chat'; end if;
  insert into public.ticket_chat_access (admin_id, ticket_id) values (auth.uid(), t);
  return query
  select m.id, m.sender_id, private.display_name(m.sender_id), m.body, m.kind, m.attachment_name, m.created_at
  from public.messages m
  join public.conversations c on c.id = m.conversation_id
  where c.ticket_id = t
  order by m.created_at
  limit 1000;
end;
$$;

revoke execute on function public.create_ticket(text, text, text, uuid) from public, anon;
revoke execute on function public.route_ticket(uuid, uuid) from public, anon;
revoke execute on function public.claim_ticket(uuid) from public, anon;
revoke execute on function public.resolve_ticket(uuid, boolean) from public, anon;
revoke execute on function public.search_ticket_chats(text, int, int) from public, anon;
revoke execute on function public.read_ticket_chat(uuid) from public, anon;
grant execute on function public.create_ticket(text, text, text, uuid) to authenticated;
grant execute on function public.route_ticket(uuid, uuid) to authenticated;
grant execute on function public.claim_ticket(uuid) to authenticated;
grant execute on function public.resolve_ticket(uuid, boolean) to authenticated;
grant execute on function public.search_ticket_chats(text, int, int) to authenticated;
grant execute on function public.read_ticket_chat(uuid) to authenticated;
