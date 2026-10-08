# Pages status

Last updated: 2026-10-08

## Done (real data)
- /dashboard (home): greeting, profile completion, mini calendar, Coming up (events), latest announcement (news), feed (posts, likes, comments, hidden posts), quick chat (chats), notifications (filled by database triggers)
- /login, /sign-up, /auth/callback (Supabase auth, email confirmation)
- Dashboard header (real name, initials, log out) and route protection (middleware)
- /dashboard/profile (profiles table, full edit form)
- /dashboard/people (real members, connection requests, live updates)
- /dashboard/chats (conversations + messages, unread counts, live updates; header badge and home quick chat use the same data)
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
- 013 roles (super admin, admins, AU email domains only; replaces editors)
