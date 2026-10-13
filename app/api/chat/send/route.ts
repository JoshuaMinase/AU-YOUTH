// Sends a chat message after an AI check. The browser calls this instead of inserting into
// `messages` directly. Flagged messages are not saved: they are logged for admins
// (public.report_flagged_message, docs/sql/016_chat_moderation.sql) and the sender is told why.
//
// Three kinds of request (all JSON):
//   { conversationId, text }                                  a text message
//   { conversationId, text?, kind, attachment }               a photo, file or voice message (file already uploaded
//                                                             to the chat-files bucket, docs/sql/023_chat_media.sql);
//                                                             `text` is the optional caption
//   Text and file messages may also carry `replyTo` (the id of the message being answered, in the same conversation).
//   { conversationId, forwardOf }                             forwards a message you can read; its file is copied into
//                                                             this conversation's folder
// The AI checks every text, and every photo (OpenAI cannot check voice messages or documents, so those are not screened).
//
// Needs the OPENAI_API_KEY environment variable on Render (server only, never NEXT_PUBLIC_*).
// After a message is saved, the other person in a 1:1 chat or ticket chat gets an email (lib/chatEmail.ts, docs/sql/040); it never blocks or fails the send.
// OpenAI's moderation endpoint is free. If the key is missing or OpenAI is down, the message is
// sent anyway (fail open) so chats keep working; the problem is written to the server log.
import { createClient } from '@/lib/supabase/server';
import {
  AUDIO_TYPES, CHAT_BUCKET, CHAT_GIF_MAX_BYTES, CHAT_MAX_BYTES, CHAT_MAX_SECONDS, CHAT_MAX_TEXT, FILE_TYPES, baseType, cleanName,
  type ChatKind,
} from '@/lib/chatFiles';
import { matchesType } from '@/lib/fileSniff';
import { emailChatRecipients } from '@/lib/chatEmail';

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

type Supabase = ReturnType<typeof createClient>;

/** `input` is a string (text) or a one-item list holding an image; returns the blocked categories */
async function moderate(input: unknown): Promise<string[] | 'unavailable'> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) { console.error('[chat moderation] OPENAI_API_KEY is not set, message sent without a check'); return 'unavailable'; }
  try {
    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'omni-moderation-latest', input }),
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

/** downloads a just-uploaded photo (as the sender, the bucket policy allows it) and has the AI look at it */
async function screenPhoto(supabase: Supabase, path: string, claimedType: string): Promise<string[] | 'unavailable' | 'too-big'> {
  const { data, error } = await supabase.storage.from(CHAT_BUCKET).download(path);
  if (error || !data) { console.error('[chat moderation] could not download the photo', error?.message); return 'unavailable'; }
  if (data.size > CHAT_GIF_MAX_BYTES) return 'too-big';
  const type = data.type.startsWith('image/') ? data.type : claimedType;
  const b64 = Buffer.from(await data.arrayBuffer()).toString('base64');
  return moderate([{ type: 'image_url', image_url: { url: `data:${type};base64,${b64}` } }]);
}

/** logs a blocked message for the admins, removes its file and answers 422 */
async function block(supabase: Supabase, conversationId: string, logText: string, cats: string[], what: string, path?: string) {
  await supabase.rpc('report_flagged_message', { conv: conversationId, msg: logText, cats });
  if (path) await supabase.storage.from(CHAT_BUCKET).remove([path]);
  const reasons = Array.from(new Set(cats.map((c) => FRIENDLY[c] ?? 'inappropriate content')));
  return Response.json({
    blocked: true,
    error: `This ${what} was not sent because it looks like it contains ${reasons.join(' and ')}. Please keep the chat respectful. Admins have been informed.`,
  }, { status: 422 });
}

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const CONV_RE = new RegExp(`^${UUID}$`);
const PATH_RE = new RegExp(`^${UUID}/${UUID}\\.[a-z0-9]{2,5}$`);
const KINDS: ChatKind[] = ['image', 'file', 'voice'];

/** the first bytes of an uploaded file and its real size, read through a short-lived link (null when the file is not there) */
async function readHead(supabase: ReturnType<typeof createClient>, path: string): Promise<{ head: Uint8Array; total: number | null } | null> {
  try {
    const { data, error } = await supabase.storage.from(CHAT_BUCKET).createSignedUrl(path, 60);
    if (error || !data) return null;
    const res = await fetch(data.signedUrl, { headers: { Range: 'bytes=0-1023' }, cache: 'no-store', signal: AbortSignal.timeout(15_000) });
    if (!res.ok || !res.body) return null;
    const range = /\/(\d+)$/.exec(res.headers.get('content-range') ?? '');
    const length = Number(res.headers.get('content-length'));
    const total = range ? Number(range[1]) : res.status === 200 && Number.isFinite(length) && length > 0 ? length : null;
    const reader = res.body.getReader();
    const head = new Uint8Array(1024);
    let n = 0;
    while (n < head.length) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      const take = Math.min(value.length, head.length - n);
      head.set(value.subarray(0, take), n);
      n += take;
    }
    await reader.cancel().catch(() => {});
    return { head: head.subarray(0, n), total };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Please log in again.' }, { status: 401 });

  let body: { conversationId?: unknown; text?: unknown; kind?: unknown; attachment?: unknown; forwardOf?: unknown; replyTo?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: 'Bad request.' }, { status: 400 }); }
  const conversationId = typeof body.conversationId === 'string' ? body.conversationId : '';
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!CONV_RE.test(conversationId)) return Response.json({ error: 'Pick a conversation first.' }, { status: 400 });
  if (text.length > CHAT_MAX_TEXT) return Response.json({ error: 'That message is too long.' }, { status: 400 });

  /* a reply must answer a message of this same conversation that still exists (the database enforces the conversation too) */
  let replyTo: string | null = null;
  if (body.replyTo !== undefined && body.replyTo !== null) {
    const rid = typeof body.replyTo === 'string' ? body.replyTo : '';
    if (!CONV_RE.test(rid)) return Response.json({ error: 'Bad request.' }, { status: 400 });
    const { data: target } = await supabase.from('messages').select('id').eq('id', rid).eq('conversation_id', conversationId).maybeSingle();
    if (!target) return Response.json({ error: 'The message you are replying to is no longer there.' }, { status: 404 });
    replyTo = rid;
  }

  /* ── forward a message ─────────────────────────────────────────── */
  if (body.forwardOf !== undefined) {
    const id = typeof body.forwardOf === 'string' ? body.forwardOf : '';
    // the select policy means you can only forward what you can read
    const { data: src } = await supabase.from('messages')
      .select('kind, body, attachment_path, attachment_name, attachment_type, attachment_size, attachment_seconds')
      .eq('id', id).maybeSingle();
    if (!src) return Response.json({ error: 'You cannot forward that message.' }, { status: 404 });
    if (src.kind === 'ticket') return Response.json({ error: 'A ticket cannot be forwarded.' }, { status: 400 });

    if (src.body?.trim()) {
      const result = await moderate(src.body);
      if (result !== 'unavailable' && result.length) return block(supabase, conversationId, src.body, result, 'message');
    }

    let path: string | null = null;
    if (src.attachment_path) {
      const ext = (src.attachment_path.split('.').pop() ?? 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'bin';
      path = `${conversationId}/${crypto.randomUUID()}.${ext}`;
      // copied (not shared) so the file always sits in the folder of the conversation that holds the message
      const { error } = await supabase.storage.from(CHAT_BUCKET).copy(src.attachment_path, path);
      if (error) return Response.json({ error: 'Could not forward the file. Try again.' }, { status: 400 });
    }
    const newId = crypto.randomUUID();
    const { error } = await supabase.from('messages').insert({
      id: newId, conversation_id: conversationId, sender_id: user.id, body: src.body, kind: src.kind, forwarded: true,
      attachment_path: path, attachment_name: src.attachment_name, attachment_type: src.attachment_type,
      attachment_size: src.attachment_size, attachment_seconds: src.attachment_seconds,
    });
    if (error) {
      if (path) await supabase.storage.from(CHAT_BUCKET).remove([path]);
      return Response.json({ error: error.message }, { status: 400 });
    }
    void emailChatRecipients(newId);
    return Response.json({ ok: true });
  }

  /* ── a photo, file or voice message ────────────────────────────── */
  if (body.attachment !== undefined) {
    const kind = body.kind as ChatKind;
    const a = (body.attachment ?? {}) as Record<string, unknown>;
    const path = typeof a.path === 'string' ? a.path : '';
    const type = baseType(typeof a.type === 'string' ? a.type : '');
    const size = Number(a.size);
    const seconds = a.seconds === undefined || a.seconds === null ? null : Number(a.seconds);
    const name = cleanName(typeof a.name === 'string' ? a.name : '');

    if (!KINDS.includes(kind)) return Response.json({ error: 'Bad request.' }, { status: 400 });
    if (!PATH_RE.test(path) || !path.startsWith(`${conversationId}/`)) return Response.json({ error: 'Bad request.' }, { status: 400 });
    if (!Number.isInteger(size) || size < 1 || size > CHAT_MAX_BYTES) return Response.json({ error: 'That file is too big (10 MB at most).' }, { status: 400 });
    if (seconds !== null && (!Number.isInteger(seconds) || seconds < 1 || seconds > CHAT_MAX_SECONDS)) return Response.json({ error: 'Bad request.' }, { status: 400 });
    // a photo must be sent as kind "image" (that is the only kind the AI looks at), so a document may not carry an image type
    const isImg = type.startsWith('image/');
    const okType = kind === 'voice' ? AUDIO_TYPES.includes(type) : kind === 'image' ? isImg && FILE_TYPES.includes(type) : !isImg && FILE_TYPES.includes(type);
    if (!okType) return Response.json({ error: 'That kind of file cannot be sent.' }, { status: 400 });

    /* Look at the uploaded file itself: it must exist, be the size it says, and really be what its type claims.
       Otherwise a picture could be labelled as a document and skip the photo check. */
    const probe = await readHead(supabase, path);
    if (!probe) return Response.json({ error: 'Could not check that file. Please try sending it again.' }, { status: 400 });
    if (!matchesType(type, probe.head) || (probe.total !== null && probe.total > CHAT_MAX_BYTES)) {
      await supabase.storage.from(CHAT_BUCKET).remove([path]);
      return Response.json({ error: 'That file is not the kind of file it says it is, so it was not sent.' }, { status: 400 });
    }
    const realSize = probe.total ?? size;

    if (text) {
      const result = await moderate(text);
      if (result !== 'unavailable' && result.length) return block(supabase, conversationId, text, result, 'message', path);
    }
    if (kind === 'image') {
      const result = await screenPhoto(supabase, path, type);
      if (result === 'too-big') {
        await supabase.storage.from(CHAT_BUCKET).remove([path]);
        return Response.json({ error: 'That photo is too big (4 MB at most).' }, { status: 400 });
      }
      if (result !== 'unavailable' && result.length) return block(supabase, conversationId, `[Photo blocked: ${name}]${text ? ` ${text}` : ''}`, result, 'photo', path);
    }

    const newId = crypto.randomUUID();
    const { error } = await supabase.from('messages').insert({
      id: newId, conversation_id: conversationId, sender_id: user.id, body: text, kind,
      attachment_path: path, attachment_name: name, attachment_type: type, attachment_size: realSize, attachment_seconds: kind === 'voice' ? seconds : null, reply_to: replyTo,
    });
    if (error) return Response.json({ error: error.message }, { status: 400 });
    void emailChatRecipients(newId);
    return Response.json({ ok: true });
  }

  /* ── a text message ────────────────────────────────────────────── */
  if (!text) return Response.json({ error: 'Write a message first.' }, { status: 400 });

  const result = await moderate(text);
  if (result !== 'unavailable' && result.length) return block(supabase, conversationId, text, result, 'message');

  const newId = crypto.randomUUID();
  const { error } = await supabase.from('messages').insert({ id: newId, conversation_id: conversationId, sender_id: user.id, body: text, reply_to: replyTo });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  void emailChatRecipients(newId);
  return Response.json({ ok: true });
}
