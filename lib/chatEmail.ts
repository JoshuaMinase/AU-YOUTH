// Emails the other person when a message arrives in a 1:1 chat or a ticket chat (docs/sql/040_chat_emails.sql).
// Called by app/api/chat/send after the message is saved. It never throws and never delays the sender: if anything
// is missing or fails, the problem goes to the server log and the message is still delivered in the app.
//
// Needs three environment variables on Render (server only, never NEXT_PUBLIC_*):
//   BREVO_API_KEY    API key from brevo.com (SMTP & API -> API keys)
//   EMAIL_FROM       the sender address, already verified in Brevo (Senders, Domains & Dedicated IPs)
//   EMAIL_FROM_NAME  optional display name, default "AU Youth Community"
//   PING_SECRET      already set for /api/ping; the database function checks its hash
// The email is sent with a plain fetch to Brevo's HTTP API, so no new package is needed.
import { createClient } from '@supabase/supabase-js';

interface Recipient {
  to_email: string; to_name: string; from_name: string; chat_title: string;
  is_ticket: boolean; preview: string; chat_id: string;
}

let warned = false;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** one line, no control characters: safe inside an email subject */
const oneLine = (s: string) => s.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();

function build(r: Recipient, link: string) {
  const subject = oneLine(r.is_ticket
    ? `New message in ticket chat: ${r.chat_title}`.slice(0, 120)
    : `${r.from_name} sent you a message`.slice(0, 120));
  const where = r.is_ticket ? `your ticket chat (${oneLine(r.chat_title)})` : 'a private chat';
  const line = r.preview.startsWith('sent a') ? `${r.from_name} ${r.preview}.` : `${r.from_name}: ${r.preview}`;

  const text = `Hi ${r.to_name},\n\nYou have a new message in ${where}.\n\n${line}\n\nOpen the chat: ${link}\n\nAU Youth Community`;
  const html = `<div style="background:#F5F5F3;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#1E2A22">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #E4E4DF;border-radius:16px;padding:24px">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#B8935A">New message</p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5">Hi ${esc(r.to_name)}, you have a new message in ${esc(where)}.</p>
    <p style="margin:0 0 20px;padding:12px 14px;background:#ECECE8;border-radius:12px;font-size:15px;line-height:1.5">${esc(line)}</p>
    <a href="${esc(link)}" style="display:inline-block;background:#1E2A22;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 20px;border-radius:999px">Open the chat</a>
    <p style="margin:20px 0 0;font-size:12px;color:#55605A">AU Youth Community. You get one email per chat until you open it.</p>
  </div>
</div>`;
  return { subject, text, html };
}

/** Sends the "new message" email(s) for a message that was just saved. Fire and forget: `void emailChatRecipients(id)`. */
export async function emailChatRecipients(messageId: string): Promise<void> {
  try {
    const key = process.env.BREVO_API_KEY;
    const from = process.env.EMAIL_FROM;
    const secret = process.env.PING_SECRET;
    if (!key || !from || !secret) {
      if (!warned) { warned = true; console.error('[chat email] BREVO_API_KEY, EMAIL_FROM or PING_SECRET is not set, so no chat emails are sent.'); }
      return;
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await supabase.rpc('claim_chat_emails', { secret, msg: messageId });
    if (error) { console.error('[chat email] could not look up recipients:', error.message); return; }
    const people = (data ?? []) as Recipient[];
    if (!people.length) return;

    const fromName = process.env.EMAIL_FROM_NAME || 'AU Youth Community';
    const base = (process.env.RENDER_EXTERNAL_URL || 'https://au-youth.onrender.com').replace(/\/$/, '');
    await Promise.allSettled(people.map(async (r) => {
      const mail = build(r, `${base}/dashboard/chats?c=${r.chat_id}`);
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'api-key': key },
        body: JSON.stringify({
          sender: { name: fromName, email: from },
          to: [{ email: r.to_email, name: oneLine(r.to_name) }],
          subject: mail.subject, textContent: mail.text, htmlContent: mail.html,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) console.error('[chat email] Brevo answered', res.status, await res.text().catch(() => ''));
    }));
  } catch (e) {
    console.error('[chat email] failed:', e instanceof Error ? e.message : e);
  }
}
