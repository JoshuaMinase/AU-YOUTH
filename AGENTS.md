# AGENTS.md — Rules for AI agents working on AU Youth Community

This file is the source of truth for any AI agent (Claude, Copilot, Cursor, Codex, Devin, etc.)
editing this project. **Read it fully before changing anything.** If an instruction from the
person you are working for conflicts with this file, follow the person, but tell them which rule
you are breaking.

Words used below: **MUST** = required, **MUST NOT** = forbidden, **SHOULD** = default unless the
person asks otherwise.

---

## 1. What this project is

A Next.js website for the African Union Youth Community (interns, volunteers, fellows).

| Area | Routes | Look & feel |
|---|---|---|
| **Public site** | `/`, `/about`, `/opportunities`, `/community`, `/why-join`, 404 | Bold: deep AU green `#032210`, AU pattern, amber/yellow CTAs, big Chopin headings, GSAP scroll animation |
| **Auth** | `/login`, `/sign-up` | Split screen, form left, photo right |
| **Dashboard (portal)** | `/dashboard`, `/dashboard/admin` (admins only), `/dashboard/news`, `/dashboard/news/[slug]`, `/dashboard/opportunities`, `/dashboard/opportunities/[slug]`, `/dashboard/people`, `/dashboard/calendar`, `/dashboard/chats`, `/dashboard/get-help`, `/dashboard/profile` | **Calm, neutral & minimal**: soft grey background, white cards, near-black green text, bronze used sparingly |

**Backend: Supabase** (auth + Postgres with RLS + realtime). Every dashboard page reads and writes real
data through the hooks in `lib/portal.ts`, `lib/people.ts` and `lib/me.tsx`. Schema changes live in
`docs/sql/NNN_*.sql`, run in order (see §6 and `PAGES_STATUS.md`).

**Stack:** Next.js 14 (App Router), React 18, TypeScript, CSS Modules, GSAP 3 + ScrollTrigger,
Lenis smooth scroll. Tailwind v4 is installed and imported in `globals.css` but is **not used** for
styling. Do not start using Tailwind classes.

---

## 2. Commands

```bash
npm install          # install
npm run dev          # dev server (http://localhost:3000)
npx tsc --noEmit     # type-check   — MUST pass
npm run lint         # ESLint       — MUST pass with 0 warnings
npm run build        # production build — MUST pass before you say "done"
```

- **MUST NOT** run `npm run build` while a dev server is running from this same folder. Both write
  to `.next/` and the dev server breaks. Stop the dev server first.
- If the dev server shows odd errors after a build, stop it, delete `.next/` and restart it.
- Deployment: Render, see `render.yaml` and `DEPLOY.md`.

---

## 3. Folder map

```
app/
  layout.tsx              Root layout. Mounts <SmoothScroll/> once for the whole site.
  globals.css             Fonts (@font-face Chopin), global tokens, Lenis CSS. Keep it small.
  page.tsx                Home: Landing → CommunitySection → PhotoStackSection → IdeasSection + Footer
  about/ opportunities/ community/ why-join/   Public pages (server components using SiteShell)
  not-found.tsx           404
  login/ sign-up/         Auth pages (styles/Auth.module.css)
  dashboard/
    layout.tsx            Portal header (glass pill + logo + wordmark), mobile tab bar, page reveal
    page.tsx              Dashboard home
    news/ news/[slug]/ opportunities/ opportunities/[slug]/ people/ calendar/ chats/ get-help/ profile/

components/
  SmoothScroll.tsx        THE ONLY Lenis instance. Exposes getLenis().
  Nav.tsx                 Public-site nav (glass pill, compacts on scroll, mobile menu)
  Footer.tsx              Footer. <Footer overlap /> only on the home page.
  Landing.tsx             Home hero + flying cards (positions from components/layout.ts)
  layout.ts               1440×1600 design canvas maths + NAV_LINKS
  CommunitySection / PhotoStackSection / IdeasSection / IdeasFolder   Home sections
  site/                   Public-page building blocks: SiteShell, PageHero, SplitHeading,
                          CtaBand, Faq, OpportunityBoard, CircleGrid, icons
  portal/ui.tsx           Dashboard building blocks: icon set `I`, Hero, Modal, useToast, MiniCalendar
  portal/tags.ts          News tag → colour class (plain module, safe for server components)
  portal/ChatMessage.tsx  One chat bubble: text, photo, file or voice message, plus its Forward button; a ticket card in department chats
  portal/Tickets.tsx      TicketRow (Get Help list + admin queue) and TicketBar (resolve bar above a temporary ticket chat)
  portal/TicketArchive.tsx  Admin-only, collapsed lookup to read a ticket chat read-only (logged)
  portal/VoiceRecorder.tsx  Records a voice message inside the chat message box
  portal/ForwardDialog.tsx  Pick one or more chats to forward a message to
  portal/NotifyMe.tsx     "Notify me" card (date + reminder toggle) on news articles and opportunities
  portal/RegisterBar.tsx  Apply (link) or Register me / Registered on an opportunity
  portal/OpportunityEditor.tsx, OpportunityAdmin.tsx  Admins: write / edit an opportunity; registered list board + CSV

lib/
  data.ts                 ALL mock data + date helpers + profile model + avatar colour helpers
  hooks.ts                useIso, useToday, useReveal, useListAnimation, copyText
  store.ts                usePersisted (localStorage state shared between components)
  portal.ts               useEvents, useChats (shared dashboard state)
  chatFiles.ts            Chat attachment limits, allowed file types and helpers (also used by app/api/chat/send)

styles/
  Site.module.css         Public pages
  Portal.module.css       Dashboard (all pages)
  Nav / Footer / Landing / PhotoStack / CommunitySection / IdeasSection / IdeasFolder / Auth .module.css
  Dashboard.module.css    UNUSED legacy file. Do not use.

public/assets/            Images, SVG patterns, logo.svg, wordmark.svg, fonts/
public/SVG/               Footer pattern ("Asset 1the pattern.svg", referenced URL-encoded)
```

---

## 4. Strict rules

### 4.1 General
1. **MUST** keep `tsc`, `lint` and `build` passing. Run all three before you finish.
2. **MUST** match the surrounding code: same naming, comment density, file layout and CSS Module style.
3. **MUST NOT** add new dependencies without the person's approval. No UI kits, no icon libraries,
   no CSS-in-JS. Icons are inline SVG (`I` in `portal/ui.tsx`, `components/site/icons.tsx`).
4. **MUST NOT** delete files without the person's approval. Commit or stash work before risky changes.
   Repo: <https://github.com/JoshuaMinase/AU-YOUTH> (branch `master`). **MUST NOT** force-push.
5. **MUST NOT** rename routes or change URLs. Every link was checked; renaming breaks them.
6. **SHOULD** keep each change small and focused. Do not reformat files you did not need to touch.

### 4.2 Next.js
1. A component that uses hooks, `window`, GSAP or event handlers **MUST** start with `'use client'`.
2. Page files (`app/**/page.tsx`) **MUST** only export what Next allows (`default`, `metadata`,
   `generateMetadata`, `generateStaticParams`, …). Put shared constants in `lib/` or `components/`.
3. **MUST NOT** import plain values (objects, arrays) from a `'use client'` file into a server
   component. They arrive as client references, not data. That's why `TAG_CLASS` lives in
   `components/portal/tags.ts` and not in `ui.tsx`.
4. Public pages are server components that wrap content in `<SiteShell>` and export `metadata`
   (`{ title: 'Page name' }`). The root layout adds "— AU Youth Community".
5. Internal links **MUST** use `next/link`. Use `<a>` only for `mailto:`, external URLs, and
   same-page `#anchors`.
6. Plain `<img>` is used on purpose (`images.unoptimized: true` in `next.config.js`). Keep the
   `{/* eslint-disable-next-line @next/next/no-img-element */}` comment above each one.

### 4.3 Dates & hydration
1. **MUST NOT** call `new Date()` during render in a component that is server-rendered. Server and
   browser time zones differ, which causes hydration errors. Use `useToday()` from `lib/hooks.ts`.
   It returns `null` on the first render, so render a placeholder until it has a value.
2. Dashboard events are generated **relative to today** (`buildEvents(today)`), so the demo never
   looks out of date. Keep it that way. Do not hard-code calendar months.
3. Date keys are local `YYYY-MM-DD` strings. Use `ymd()` / `parseYmd()`. Never use
   `toISOString()`, which shifts dates by the time-zone offset.

---

## 5. Animation & scrolling rules (the smoothness was hard-won — don't regress it)

1. **One Lenis instance only**, in `components/SmoothScroll.tsx`, driven by `gsap.ticker`.
   - **MUST NOT** create another `new Lenis(...)` anywhere.
   - To scroll from code: `getLenis()?.scrollTo(target, { offset })`, with a fallback to
     `element.scrollIntoView` when it returns `null` (reduced motion).
   - Scrollable inner panels (chat lists, modals) **MUST** have `data-lenis-prevent`.
   - Keep `lerp: 0.1`. Lower values feel "floaty/laggy", which is what the person complained about.
2. **ScrollTrigger `scrub`** values stay small: `true`, `0.5`, `0.6` or `1`. Lenis already smooths the
   wheel; big scrubs such as `2.5` stack on top of it and feel laggy.
3. Every GSAP setup **MUST** live inside `gsap.context()` or `gsap.matchMedia()` and be reverted in
   the effect cleanup. Use `useIso` (layout effect on the client) for animations that set initial
   states, so nothing flashes.
4. **MUST** respect `prefers-reduced-motion`: skip the animation and show the final state.
5. **Animate only `transform` and `opacity`** for anything that runs on scroll. Do not animate
   `backdrop-filter`, `filter`, `box-shadow` or layout properties on scroll.
   (The nav's width/height tween runs once per state change and is the only exception.)
6. A component that re-renders often (timers, typing effects) **MUST** be its own small component
   so it does not re-render big animated trees. See `TypingWord` in `Landing.tsx`.
7. Reveal pattern:
   - Add `data-reveal` to an element and it fades up when scrolled into view. `useReveal` is already
     wired in `SiteShell` (public pages) and `dashboard/layout.tsx` (portal).
   - Heading words that slide up use `SplitHeading` (public) or `Hero` (portal). Mark a highlighted
     word with `*asterisks*`.
   - Filtered or re-rendered lists use `useListAnimation(ref, key)`. Do **not** put `data-reveal`
     on items inside lists that filter.
   - ScrollTrigger `start` positions **MUST** be reachable even for the last element on a short
     page. Use `'top bottom-=20'` or similar, **never** `'top 55%'` for footer or bottom content.
8. If you add a section that changes page height after mount, call `ScrollTrigger.refresh()`.

---

## 6. Data & state rules

1. Remaining mock content lives in **`lib/data.ts`** (`ME`, `PROFILE_DEFAULT`, `PEOPLE`, used for
   department suggestions). News, chats, the feed and notifications come from Supabase. **MUST NOT**
   scatter mock data across pages.
2. Shared or persisted state uses **`usePersisted(key, initial)`** from `lib/store.ts`. Every
   component using the same key stays in sync (e.g. the chat badge in the header ↔ the chats page).
3. Existing `localStorage` keys. Reuse them; prefix any new key with `auy-`:

   | Key | Holds |
   |---|---|
      | `auy-chats-read` / `auy-chats-sent` | no longer used: chats live in Supabase (`useChats()`) |
   | `auy-posts`, `auy-likes`, `auy-hidden`, `auy-comments` | no longer used: the feed lives in Supabase (`useFeed()`) |
   | `auy-notifs-read` | no longer used: notifications live in Supabase (`useNotifications()`) |
   | `auy-connections` | people the user sent connection requests to |
   | `auy-profile` | edited profile (bio, skills, education…) |

4. `useEvents(today)` (calendar + home) now reads and writes the Supabase `events` table (RLS: your own rows plus every `is_public` event; only admins can create public events, only the owner can edit or delete). Use the other shared hooks too, do not re-implement them:
   `useChats()` (header badge, chats page, home quick chat). The profile completion % **MUST** come
   from `profileScore()` so the home ring and the profile page always agree.
5. When a real backend arrives: replace the internals of `lib/data.ts`, `lib/store.ts` and
   `lib/portal.ts`, and keep their function signatures so the pages don't change.

---

## 7. Design system

### 7.1 Brand assets (do not alter)
- Logo `public/assets/logo.svg`, wordmark `public/assets/wordmark.svg`. They **MUST** appear in
  the public nav (`Nav.tsx`), the dashboard header (`dashboard/layout.tsx`), and the auth pages.
  Do not recolour, redraw or replace them with text or a placeholder.
- Font: **Chopin** (400/500/600/700/900, defined in `globals.css`) everywhere. No other font
  families. Do not add Google Fonts.
- Patterns: `pattern.svg` (green hero pattern), `section2-bg.svg`,
  `public/SVG/Asset 1the pattern.svg` (footer mandala), `card-{health,impact,growth,wellbeing}.svg`.

### 7.2 Public site palette (bold) — `globals.css` tokens
| Token | Value | Use |
|---|---|---|
| `--au-green` | `#032210` | heroes, dark sections, primary text |
| `--au-yellow` | `#FCD116` | highlighted heading words, stats |
| `--au-amber` | `#FBB13C` | primary CTA buttons |
| `--au-teal` / `--au-plum` / `--au-sky` | `#218380` / `#8F2D56` / `#73D2DE` | the four colour cards (with `--au-amber`) |
| `--au-blue` / `--au-leaf` / `--au-gold` | `#0072C6` / `#117302` / `#C9AB5C` | accents |

Public page recipe: `PageHero` (green + pattern + split heading) → sections alternating
`.section .sectionTint` (soft grey→white gradient) and plain white → `CtaBand` → Footer.

### 7.3 Dashboard palette (calm — the person explicitly asked for this)
Defined on `.shell` in `Portal.module.css`:

| Token | Value | Use |
|---|---|---|
| `--p-bg` | `#F5F5F3` | page background |
| card | `#FFFFFF` + `1px solid var(--line)` | cards |
| `--p-ink` | `#1E2A22` | text, primary buttons (`.btnDark`), active nav |
| `--p-ink-2` | `#55605A` | secondary text |
| `--p-accent` | `#B8935A` | bronze: eyebrows, the highlighted heading word, badges. **Small doses only.** |
| `--p-accent-lt` | `#E2CBA4` | bronze on dark surfaces, soft `.btn` |
| `--p-soft` | `#ECECE8` | soft fills, chips |

Dashboard rules:
1. **MUST NOT** bring the bold public colours (amber `#FBB13C`, yellow `#FCD116`, saturated
   greens/blues) into the dashboard as large fills. Colour comes from **photos** and **small tags**.
2. Avatars and icon tiles **MUST** use `softAvatar(hex)` from `lib/data.ts` (a light tint plus dark
   text), not solid colours.
3. Page headers on **News, People, Calendar, Get Help** use `<Hero plain …>`: text only, no box,
   no border, no pattern. Bronze eyebrow, huge Chopin 900 title with one `*word*` in bronze, grey
   description. Chats and Profile still use the boxed `<Hero>`; change them only if the person asks.
4. Dashboard home layout (desktop: 3 columns):
   - **Left:** compact profile-completion row → mini calendar card
   - **Centre:** latest announcement (photo `baskets.webp` + dark scrim) → text-only greeting →
     post composer → feed
   - **Right:** **Quick chat first** → Notifications → Coming up
   - On mobile the centre column comes first and a bottom tab bar replaces the header nav.
5. Buttons: `.btnDark` (primary), `.btnLine` (secondary), `.btn` (soft bronze), `.btnGhost` (on
   dark), plus `.btnSm`. Cards: `.card`. Do not invent new button styles.

### 7.4 Shared shape language
- Card radius **22px** (large banners 28px, small items 14px), pills `999px`.
- Eyebrow: 11–13px, bold, uppercase, letter-spacing `.14em`.
- Hover: lift `translateY(-2px…-4px)` + soft shadow; easing `var(--ease)` = `cubic-bezier(.22,.9,.32,1)`.
- Focus: every interactive element keeps a visible `:focus-visible` outline.

### 7.5 Responsive
- Breakpoints in use: `1240px`, `1080px`, `900px` (public nav → burger menu), `860px` (dashboard →
  bottom tab bar), `760px`, `560px`.
- **MUST** have no horizontal scroll at 390px wide. Check every new layout at **1440px and 390px**.

---

## 8. Images & performance

1. **MUST NOT** use the large originals (`card-img-*.jpg` ~1–3.6MB each,
   `community-illustration.png`; the 4.7MB `charlotte-harrison-…jpg` source is kept out of git). Use the `.webp` versions
   (`card-img-1..4.webp`, `baskets.webp`, `community-illustration.webp`).
2. A new photo **MUST** be resized (≤1600px wide) and converted to WebP (quality ~75–80) before use.
   Target under 350KB.
3. Images below the fold get `loading="lazy"`. Decorative images get `alt=""` + `aria-hidden="true"`.
   Meaningful images get real alt text.
4. Large SVG patterns (400–560KB) are reused and cached. Don't add new big SVGs without a reason.

---

## 9. Accessibility (non-negotiable)

- Buttons are `<button type="button">`; navigation is `<Link>`/`<a>`. Never a clickable `<div>`.
- Toggle buttons use `aria-pressed`; expanders use `aria-expanded` (+ `aria-controls`).
- Icon-only buttons need `aria-label`. Live counts and results use `aria-live="polite"`.
- Modals: use `Modal` from `portal/ui.tsx`. It handles focus, Escape and closing on a backdrop click.
- Every form input has a `<label>` (or `aria-label`).

---

## 10. Content rules

- Copy is about AU interns, volunteers and fellows. Keep it warm, short and practical.
- Mock people, emails (`*@au.int`) and news are placeholders. **MUST NOT** present them as real
  facts outside this demo, and **MUST NOT** add real personal data.
- The current user is `ME` in `lib/data.ts` (Yididiya D.). Change names there, nowhere else.

---

## 11. Before you say "done" — checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` shows no warnings or errors
- [ ] `npm run build` passes (dev server stopped first)
- [ ] Every new link points to an existing route or asset (no `href="#"`)
- [ ] Checked at 1440px and 390px: no horizontal scroll, nothing stuck at opacity 0
- [ ] Browser console has no errors or hydration warnings
- [ ] Reduced-motion still shows all content
- [ ] Dashboard changes follow the calm palette (§7.3); public changes follow the bold palette (§7.2)
- [ ] You told the person exactly what changed and anything you could not verify

---

## 12. Known gaps / backlog (not bugs — just not built yet)

- Roles (docs/sql/013_roles.sql): one super admin (ZemenA@africanunion.org) → admins (super admin sets them from the Admin panel, one per department, enforced by docs/sql/025; the Admins list there shows every department with its admin for all admins) → users. Only admins post on the feed; users comment. Admins delete only their own posts and can request deletion of another's; the author or the super admin approves or declines. Sign-up only for @africanunion.org / @africa-union.org. Admins write news on /dashboard/news (Edit/Delete on the article) Admin panel at /dashboard/admin (Admin tab, admins only): admins list (super admin adds/removes), deletion requests, support tickets, departments added by members.
- Support tickets (docs/sql/029): a member files a ticket from Get Help and picks the department, or leaves it to the admins (who route it in the Admin panel). The ticket is a card in that department's group chat; a member takes it, which opens a temporary chat with the reporter. Both mark it resolved to close it; the chat expires 24 h later (the database stops showing it, `private.is_member` checks `expires_at`). Admins read ticket chats read-only from the Admin panel, each opening logged. Tickets are created and changed only through the SQL functions (`create_ticket`, `route_ticket`, `claim_ticket`, `resolve_ticket`), never by direct insert or update.
- Unused legacy files that can be deleted once the person approves: `styles/Dashboard.module.css`
  and the original JPG/PNG photos listed in §8.
- Ideas the person may want later: text-only headers on Chats and Profile too, a rotating
  announcement card, a one-line daily summary under the greeting, a softer dashboard wordmark.
