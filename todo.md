# To do (future)

Things to do later. Tick them off (`[x]`) when done and add new ones at the bottom of the matching section.

## Email (chat notifications)
- [ ] **Get a domain and add it to Brevo.** The chat emails are sent from a Gmail address now, which Brevo warns about (no own DKIM, DMARC "freemail domain is not recommended") and which can land in spam or be blocked.
  - [ ] Buy a domain you own, e.g. `auyouthcommunity.org` (check it is free first). Do not use `onrender.com` or `africanunion.org`.
  - [ ] Brevo -> Senders, Domains & Dedicated IPs -> Domains -> Add a domain; add the DNS records Brevo shows (verification code, DKIM, DMARC) at the registrar; click Authenticate.
  - [ ] Brevo -> Senders: add `notifications@<your domain>` and verify it.
  - [ ] Render -> Environment: change `EMAIL_FROM` to that address (Render redeploys). No code change needed.
- [ ] Test the chat emails on Render: send a 1:1 message and a ticket-chat message between two accounts; check inbox and spam; if nothing arrives, read the `[chat email]` line in the Render logs.
- [ ] Brevo -> Security -> Authorized IPs: make sure IP restriction is off (Render's free plan has no fixed IP).
- [ ] Maybe: an "email me about new messages" on/off switch on the profile page.
- [ ] Maybe: no message text in the email (only "X sent you a message") if people prefer more privacy.
- [ ] Maybe: also email when a ticket is taken or resolved (only chat messages are emailed now).

## Legal
- [ ] Open `lib/legal.ts` and set the real operator name, contact email and governing law; have a lawyer read the Terms, Privacy, Cookie and Acceptable Use pages before launch.
- [ ] Let members delete their own account and download their data from the profile page (the Privacy Policy now says to email for this).
- [ ] Ask existing members to accept the Terms once (the sign-up tick covers new members only); the version is saved as `terms_version` in each account's metadata.
- [ ] If analytics or any other optional cookie is ever added: give the cookie notice a real "Essential only" choice and keep the tool off until it is accepted.

## Not yet tested (from PAGES_STATUS.md)
- [ ] Test /forgot-password and /reset-password on Render (Redirect URL must be set in Supabase).
- [ ] Make the reset link work on any device: Supabase -> Authentication -> Email Templates -> Reset Password: change the link to `{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery` (Site URL must be `https://au-youth.onrender.com`). Until then the link only works in the browser where the reset was requested.
- [ ] Test the calendar (events) on Render.

## Cleanup (needs approval first, see AGENTS.md section 12)
- [ ] Delete the unused `styles/Dashboard.module.css` and the original large JPG/PNG photos.
