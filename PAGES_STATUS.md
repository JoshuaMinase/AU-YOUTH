# Pages status

Last updated: 2026-10-10

## Done (real data)
- /dashboard (home): greeting, profile completion, mini calendar, Coming up (events), latest announcement (news), feed (posts, likes, comments, hidden posts), quick chat (chats), notifications (filled by database triggers)
- /login, /sign-up, /auth/callback (Supabase auth, email confirmation)
- Dashboard header (real name, initials, log out) and route protection (middleware)
- /dashboard/profile (profiles table, full edit form)
- /dashboard/people (real members, connection requests, live updates)
- /dashboard/chats (conversations + messages, unread counts, live updates; header badge and home quick chat use the same data)
- /dashboard/chats AI screening: messages go through /api/chat/send, OpenAI moderation checks them, flagged ones are blocked, logged (moderation_flags) and every admin is notified; admins review them in /dashboard/admin (needs OPENAI_API_KEY on Render and SQL 016)
- /dashboard/chats department group chats: one per department, members join automatically from their profile department, admins of that department (and the super admin) add / remove members (SQL 017)
- /dashboard/news (news table, live updates)
- /dashboard/news/[slug] (article + more stories, read on the server)
- /dashboard/get-help: "Report an issue" saves to support_tickets (department contacts, handbook and FAQ stay static on purpose)

## Partly done
- /dashboard/calendar (events): built, waiting for test on Render (events table, add / edit / delete, live updates)

## Not done (still mock or static)
- Public pages (/, /community, /opportunities, /why-join): static marketing pages, no backend needed

## SQL run in Supabase so far
- 001 profiles, 002 profile fields, 003 languages, 004 connections, 005 realtime
- 006 events
- 007 hardening, 008 support tickets, 009 news (+ editors, 6 seeded articles), 010 posts, 011 chats, 012 notifications
- 013 roles (super admin, admins, AU email domains only; replaces editors), 014 departments (pick-list; new typed names are added and the super admin is notified)
- 015 news images, 016 chat moderation (blocked-message log + admin notification), 017 department chats, 018 backfill (chats for departments members already typed), 019 gender (sign-up + profile; university / degree / year of study removed from the app, columns kept), 020 keepalive (the 10-minute self-ping now also touches the database so Supabase free does not pause it), 021 super admin overview (super admin only sees chats they belong to; Admin panel lists all department chats to manage members)
- 022 profile gate (incomplete profile = view-only: no chat, events, connections, likes or comments until bio, role, department, nationality, based in, gender and one skill are filled in; admins exempt) - NOT YET RUN
