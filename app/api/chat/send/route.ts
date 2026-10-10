// Sends a chat message after an AI check. The browser calls this instead of inserting into
// `messages` directly. Flagged messages are not saved: they are logged for admins
// (public.report_flagged_message, docs/sql/016_chat_moderation.sql) and the sender is told why.
//
// Needs the OPENAI_API_KEY environment variable on Render (server only, never NEXT_PUBLIC_*).
// OpenAI's moderation endpoint is free. If the key is missing or OpenAI is down, the message is
// sent anyway (fail open) so chats keep working; the problem is written to the server log.
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** categories that do not block a message: someone saying they feel low should not be punished or reported */
const ALLOWED = new Set(['self-harm', 'self-harm/intent']);

const FRIENDLY: Record<string, string> = {
  harassment: 'harassing or bullying language',
  'harassment/threatening': 'threats',
  hate: 'hateful language',
  'hate/threatening': 'hateful threats',
  illicit: 'content about illegal activity',
  'illicit/violent': 'content about violent illegal activity',
  'self-harm/instructions': 'self-harm instructions',
  sexual: 'sexual content',
  'sexual/minors': 'sexual content',
  violence: 'violent language',
  'violence/graphic': 'graphic violence',
};

async function screen(text: string): Promise<string[] | 'unavailable'> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) { console.error('[chat moderation] OPENAI_API_KEY is not set, message sent without a check'); return 'unavailable'; }
  try {
    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'omni-moderation-latest', input: text }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) { console.error('[chat moderation] OpenAI answered', res.status); return 'unavailable'; }
    const data = await res.json();
    const cats: Record<string, boolean> = data?.results?.[0]?.categories ?? {};
    return Object.keys(cats).filter((k) => cats[k] && !ALLOWED.has(k));
  } catch (e) {
    console.error('[chat moderation] check failed', e);
    return 'unavailable';
  }
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Please log in again.' }, { status: 401 });

  let body: { conversationId?: unknown; text?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: 'Bad request.' }, { status: 400 }); }
  const conversationId = typeof body.conversationId === 'string' ? body.conversationId : '';
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!conversationId || !text) return Response.json({ error: 'Write a message first.' }, { status: 400 });
  if (text.length > 2000) return Response.json({ error: 'That message is too long.' }, { status: 400 });

  const result = await screen(text);
  if (result !== 'unavailable' && result.length) {
    await supabase.rpc('report_flagged_message', { conv: conversationId, msg: text, cats: result });
    const reasons = Array.from(new Set(result.map((c) => FRIENDLY[c] ?? 'inappropriate content')));
    return Response.json({
      blocked: true,
      error: `This message was not sent because it looks like it contains ${reasons.join(' and ')}. Please keep the chat respectful. Admins have been informed.`,
    }, { status: 422 });
  }

  const { error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: user.id, body: text });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
