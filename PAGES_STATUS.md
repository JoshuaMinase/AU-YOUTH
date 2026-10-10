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
- /dashboard/chats attachments, voice messages and forwarding: photos (shrunk in the browser, checked by the AI), PDF / Word / Excel / PowerPoint / TXT / CSV files up to 10 MB, voice messages up to 5 minutes, and a Forward button on every message (to one or more chats). Files sit in the private chat-files bucket (needs SQL 023). Voice messages and documents are not screened by the AI, only photos and captions are
- /dashboard/news (news table, live updates)
- /dashboard/news/[slug] (article + more stories, read on the server)
- /dashboard/get-help: "Report an issue" files an internal ticket (T-0001…): the member picks the department that should fix it, or lets the admins decide. A ticket for a department shows as a card in that department's group chat; any member there can take it with "I'll take this", which opens a temporary chat with the reporter. Both mark it resolved to close it; the chat disappears for them 24 hours later. Admins route unrouted tickets in the Admin panel and can look up and read any ticket chat (read-only, logged) from the collapsed "Ticket chats" card there (needs SQL 029). Department contacts and handbook stay static on purpose; FAQs are editable by admins, see 028

## Partly done
- /dashboard/calendar (events): built, waiting for test on Render (events table, add / edit / delete, live updates). Admins see two buttons: "Add public event" (everyone sees it) and "Add private event (only me)"; members only add private events (needs 024)

## Not done (still mock or static)
- Public pages (/, /community, /opportunities, /why-join): static marketing pages, no backend needed

## SQL run in Supabase so far
- 001 profiles, 002 profile fields, 003 languages, 004 connections, 005 realtime
- 006 events
- 007 hardening, 008 support tickets, 009 news (+ editors, 6 seeded articles), 010 posts, 011 chats, 012 notifications
- 013 roles (super admin, admins, AU email domains only; replaces editors), 014 departments (pick-list; new typed names are added and the super admin is notified)
- 015 news images, 016 chat moderation (blocked-message log + admin notification), 017 department chats, 018 backfill (chats for departments members already typed), 019 gender (sign-up + profile; university / degree / year of study removed from the app, columns kept), 020 keepalive (the 10-minute self-ping now also touches the database so Supabase free does not pause it), 021 super admin overview (super admin only sees chats they belong to; Admin panel lists all department chats to manage members)
- 022 profile gate (incomplete profile = view-only: no chat, events, connections, likes or comments until role, department, nationality, based in, gender and one skill are filled in; admins and the super admin are not limited, only reminded in a banner) - NOT YET RUN
- 023 chat media (attachments, voice messages, forwarded flag; private chat-files bucket) - NOT YET RUN. Run it BEFORE pushing the app update, because the chats page reads the new columns
- 024 public events (admins can publish events everyone sees; private stays the default) - NOT YET RUN
- 025 one admin per department (set_admin refuses a second admin in the same department or a member with no department; the Admins list in the Admin panel is grouped by department) - NOT YET RUN
- 026 rename the "AU Intern Community" chat to "AU Youth Community" - NOT YET RUN
- 027 event details (optional last day for multi-day events, description, up to 3 photos in the public event-images bucket; click an event on the calendar to see everything) - NOT YET RUN. Run it BEFORE pushing the app update, because the calendar reads the new columns
- 028 FAQs (Get Help FAQs live in the `faqs` table; admins add, edit and delete them on the Get Help page; no sample rows) - NOT YET RUN. Run it BEFORE pushing the app update
- 029 ticket workflow (tickets get an ID, a title and a department; ticket cards in department chats; "I'll take this" opens a temporary reporter + volunteer chat; closes when both mark it resolved, chat gone 24 h later; admins route unrouted tickets and read ticket chats read-only from the Admin panel, every opening logged in ticket_chat_access; replaces direct ticket inserts and the admin status picker) - NOT YET RUN. Needs 022 and 023 first. Run it BEFORE pushing the app update, because the chats and Get Help pages read the new columns
