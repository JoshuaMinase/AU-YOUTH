'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MONTHS, PROFILE_LOCKED_MSG, WEEKDAYS, sortEvents, startOfDay, ticketCode, type CalEvent, type Chat, type EventType, type Msg, type NewsCat, type NewsItem, type TicketInfo } from './data';
import { AUDIO_TYPES, CHAT_BUCKET, CHAT_MAX_BYTES, audioExt, baseType, checkChatFile, chatMime, cleanName, extOf, previewOf, type ChatFile, type ChatKind } from './chatFiles';
import { useMe } from './me';
import { NEWS_COLS, timeAgo, toNews } from './news';
import { colorFor } from './people';
import { createClient } from './supabase/client';

export type EventInput = Omit<CalEvent, 'id' | 'mine' | 'isPublic' | 'by'> & { isPublic?: boolean };

function toEvent(r: Record<string, any>, myId: string): CalEvent {
  return {
    id: r.id, date: r.date, time: String(r.time ?? '').slice(0, 5),
    title: r.title, type: r.type as EventType, location: r.location ?? 'TBC',
    isPublic: !!r.is_public, mine: r.user_id === myId,
    endDate: r.end_date ?? null, description: r.description ?? '', images: r.images ?? [],
    by: r.user_id === myId ? 'You' : fullName(r.author),
  };
}

/** editing never changes who can see an event, so drop the flag before an update */
const withoutVisibility = (e: EventInput) => ({
  date: e.date, time: e.time, title: e.title, type: e.type, location: e.location,
  end_date: e.endDate && e.endDate > e.date ? e.endDate : null, description: e.description, images: e.images,
});

/** The signed-in member's own events plus every public event admins posted (Supabase `events` table, filtered by RLS), with add / update / remove. Actions return an error message or null. */
export function useEvents(today: Date | null) {
  const { me, canWrite } = useMe();
  const [rows, setRows] = useState<CalEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!me.id) return;
    const { data, error: err } = await createClient().from('events').select('id, user_id, date, time, title, type, location, is_public, end_date, description, images, author:profiles(first_name, last_name)');
    if (err) setError(err.message);
    else { setError(null); setRows((data ?? []).map((r) => toEvent(r, me.id))); }
    setLoaded(true);
  }, [me.id]);

  useEffect(() => { load(); }, [load]);

  // Live updates: another tab or device changes your events, and reload when the tab regains focus.
  useEffect(() => {
    if (!me.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`events-${me.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => { load(); })
      .subscribe();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      supabase.removeChannel(channel);
    };
  }, [me.id, load]);

  const events = useMemo(() => (today ? [...rows].sort(sortEvents) : []), [today, rows]);

  const run = useCallback(async (op: PromiseLike<{ error: { message: string } | null }>) => {
    const { error: err } = await op;
    await load();
    return err ? err.message : null;
  }, [load]);

  const add = useCallback((e: EventInput) => {
    if (!me.id) return Promise.resolve('You are not signed in.');
    if (!canWrite) return Promise.resolve(PROFILE_LOCKED_MSG);
    return run(createClient().from('events').insert({ ...withoutVisibility(e), is_public: !!e.isPublic, user_id: me.id }));
  }, [me.id, canWrite, run]);
  const update = useCallback((id: string, e: EventInput) =>
    canWrite ? run(createClient().from('events').update(withoutVisibility(e)).eq('id', id)) : Promise.resolve(PROFILE_LOCKED_MSG), [canWrite, run]);
  const remove = useCallback(async (id: string) => {
    const imgs = rows.find((r) => r.id === id)?.images ?? [];
    const msg = await run(createClient().from('events').delete().eq('id', id));
    if (!msg) await removeEventImages(imgs);
    return msg;
  }, [run, rows]);

  return { events, add, update, remove, loaded, error };
}

const fullName = (p: { first_name?: string | null; last_name?: string | null } | null) =>
  `${(p?.first_name ?? '').trim()} ${(p?.last_name ?? '').trim()}`.trim() || 'Member';
const initialsOf = (name: string) => name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
/** chat list time: "10:22" today, "Yesterday", the weekday this week, then the date */
function chatTime(iso: string, now: Date) {
  const d = new Date(iso);
  const days = Math.round((startOfDay(now).getTime() - startOfDay(d).getTime()) / 86400000);
  if (days <= 0) return hhmm(d);
  if (days === 1) return 'Yesterday';
  if (days < 7) return WEEKDAYS[d.getDay()];
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

/** one call to the send route (it checks the message with the AI first); returns an error message or null */
async function postMessage(body: Record<string, unknown>): Promise<string | null> {
  try {
    const res = await fetch('/api/chat/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) return null;
    const data = await res.json().catch(() => null);
    return data?.error ?? 'Could not send. Try again.';
  } catch { return 'Could not reach the server. Check your connection.'; }
}

/** the ticket columns every ticket query asks for (docs/sql/029_ticket_workflow.sql) */
const TICKET_COLS = `id, ticket_no, title, area, description, urgency, status, user_id, assignee_id, dept_id,
  reporter_resolved_at, assignee_resolved_at, closed_at,
  reporter:profiles!support_tickets_user_id_fkey(first_name, last_name, dept),
  assignee:profiles!support_tickets_assignee_id_fkey(first_name, last_name)`;

function toTicketInfo(r: Record<string, any>, myId: string): TicketInfo {
  return {
    id: r.id, code: ticketCode(r.ticket_no), title: r.title ?? r.area ?? 'Issue', description: r.description, urgency: r.urgency, status: r.status,
    reporter: fullName(r.reporter), reporterDept: (r.reporter?.dept ?? '').trim(), assignee: r.assignee ? fullName(r.assignee) : '',
    iAmReporter: r.user_id === myId, iAmAssignee: r.assignee_id === myId,
    reporterResolved: !!r.reporter_resolved_at, assigneeResolved: !!r.assignee_resolved_at,
  };
}

const CHAT_COLS = `id, is_group, title, last_message_at, expires_at, dept:departments(name),
  ticket:support_tickets!conversations_ticket_id_fkey(${TICKET_COLS}),
  conversation_members(user_id, last_read_at, profile:profiles!conversation_members_user_id_fkey(first_name, last_name)),
  messages(id, sender_id, body, created_at, kind, attachment_path, attachment_name, attachment_type, attachment_size, attachment_seconds, forwarded,
    ticket:support_tickets!messages_ticket_id_fkey(${TICKET_COLS}))`;

/** the file a message row carries, if any */
const fileOf = (m: Record<string, any>): ChatFile | undefined => m.attachment_path
  ? { path: m.attachment_path, name: m.attachment_name ?? 'file', type: m.attachment_type ?? '', size: m.attachment_size ?? 0, seconds: m.attachment_seconds ?? undefined }
  : undefined;

/**
 * Your conversations (Supabase `conversations`, `conversation_members`, `messages`) with live updates.
 * Shared by the header badge, the chats page and home quick chat. send/markRead return an error message or null.
 */
export function useChats() {
  const { me, canWrite } = useMe();
  const [chats, setChats] = useState<(Chat & { preview: string })[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /* messages being sent: shown at once with a spinner, dropped when the real message has loaded */
  const [pending, setPending] = useState<Record<string, Msg[]>>({});
  /* a ticket chat works even with an unfinished profile (the person who reported a problem must be able to answer) */
  const ticketChats = useRef<Set<string>>(new Set());
  const may = useCallback((id: string) => canWrite || ticketChats.current.has(id), [canWrite]);

  const load = useCallback(async () => {
    if (!me.id) return;
    const { data, error: err } = await createClient().from('conversations').select(CHAT_COLS)
      .order('last_message_at', { ascending: false })
      .order('created_at', { referencedTable: 'messages', ascending: false })
      .limit(200, { referencedTable: 'messages' });
    if (err) { setError(err.message); setLoaded(true); return; }
    const now = new Date();
    setError(null);
    const mapped = (data ?? [])
      .filter((r: Record<string, any>) => !r.expires_at || new Date(r.expires_at) > now)   // an expired ticket chat is gone (the database hides it too)
      .map((r: Record<string, any>): Chat & { preview: string } => {
      const members: { user_id: string; last_read_at: string; profile: { first_name: string | null; last_name: string | null } | null }[] = r.conversation_members ?? [];
      const mine = members.find((m) => m.user_id === me.id);
      const other = members.find((m) => m.user_id !== me.id);
      const ticket = r.ticket ? toTicketInfo(r.ticket, me.id) : undefined;
      const name = ticket ? `${ticket.code} · ${ticket.title}` : r.is_group ? r.title ?? 'Group' : fullName(other?.profile ?? null);
      const names = Object.fromEntries(members.map((m) => [m.user_id, fullName(m.profile)]));
      const rows: Record<string, any>[] = [...(r.messages ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
      const messages: Msg[] = rows.map((m) => ({
        id: m.id, from: m.sender_id === me.id ? 'me' : 'them', text: m.body, time: hhmm(new Date(m.created_at)),
        who: r.is_group && m.sender_id !== me.id ? names[m.sender_id] ?? 'Member' : undefined,
        kind: (m.kind ?? 'text') as ChatKind, file: fileOf(m), forwarded: !!m.forwarded,
        ticket: m.ticket ? toTicketInfo(m.ticket, me.id) : undefined,
      }));
      const last = rows[rows.length - 1];
      return {
        id: r.id, name, group: !!r.is_group, ticket, expiresAt: r.expires_at ?? null,
        initials: ticket ? 'TK' : r.is_group ? 'AU' : initialsOf(name), color: ticket ? '#8F2D56' : r.is_group ? '#032210' : colorFor(other?.user_id ?? r.id),
        unread: rows.filter((m) => m.sender_id !== me.id && (!mine || m.created_at > mine.last_read_at)).length,
        time: chatTime(last?.created_at ?? r.last_message_at, now), messages,
        dept: r.dept?.name ?? undefined,
        members: members.map((m) => ({ id: m.user_id, name: names[m.user_id] ?? 'Member' })),
        preview: last ? previewOf({ kind: last.kind, body: last.body, file: fileOf(last) }) : 'No messages yet',
      };
    });
    ticketChats.current = new Set(mapped.filter((c) => c.ticket).map((c) => c.id));
    setChats(mapped);
    setLoaded(true);
  }, [me.id]);

  useEffect(() => { load(); }, [load]);

  // Live updates. Several components use this hook at once, so each gets its own channel name.
  useEffect(() => {
    if (!me.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`chats-${me.id}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => { load(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_members' }, () => { load(); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_tickets' }, () => { load(); })   // a ticket was taken or closed
      .subscribe();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      supabase.removeChannel(channel);
    };
  }, [me.id, load]);

  const unread = chats.reduce((n, c) => n + c.unread, 0);

  /* only write when there is something unread, so opening a chat doesn't spam updates */
  const unreadOf = useRef<Record<string, number>>({});
  unreadOf.current = Object.fromEntries(chats.map((c) => [c.id, c.unread]));
  const markRead = useCallback(async (id: string) => {
    if (!me.id || !unreadOf.current[id]) return null;
    const { error: err } = await createClient().from('conversation_members')
      .update({ last_read_at: new Date().toISOString() }).eq('conversation_id', id).eq('user_id', me.id);
    if (err) return err.message; // no reload, so a failing write can't loop with the chats page effect
    // the group chat notification (SQL 030) is read once the chat is on screen
    await createClient().from('notifications').update({ read_at: new Date().toISOString() })
      .eq('user_id', me.id).eq('kind', 'chat_message').eq('href', `/dashboard/chats?c=${id}`).is('read_at', null);
    await load();
    return null;
  }, [me.id, load]);

  const addPending = useCallback((id: string, msgs: Msg[]) => setPending((p) => ({ ...p, [id]: [...(p[id] ?? []), ...msgs] })), []);
  const dropPending = useCallback((id: string, ids: string[]) => {
    setPending((p) => ({ ...p, [id]: (p[id] ?? []).filter((m) => !ids.includes(m.id!)) }));
  }, []);

  const send = useCallback(async (id: string, text: string) => {
    if (!may(id)) return PROFILE_LOCKED_MSG;
    const mine: Msg = { id: `pending-${crypto.randomUUID()}`, from: 'me', text, time: hhmm(new Date()), kind: 'text', pending: true };
    addPending(id, [mine]);
    /* goes through the server so the AI can check the text first (app/api/chat/send/route.ts) */
    const msg = await postMessage({ conversationId: id, text });
    await load();
    dropPending(id, [mine.id!]);
    return msg;
  }, [load, may, addPending, dropPending]);

  /**
   * Photos, documents and voice messages. Every item shows in the chat at once with a spinner, then they upload one after
   * another through the same checked route. Stops at the first failure: `done` is how many were sent, `error` says why the next one was not.
   * `caption` is optional text.
   */
  const sendFiles = useCallback(async (id: string, items: { file: File | Blob; caption?: string; voiceSeconds?: number }[]) => {
    if (!may(id)) return { error: PROFILE_LOCKED_MSG as string | null, done: 0 };
    const queued: Msg[] = items.map((it) => {
      const name = it.voiceSeconds ? 'Voice message' : cleanName((it.file as File).name ?? 'file');
      const type = it.voiceSeconds ? baseType(it.file.type) : chatMime(name) ?? '';
      const kind: ChatKind = it.voiceSeconds ? 'voice' : type.startsWith('image/') ? 'image' : 'file';
      return {
        id: `pending-${crypto.randomUUID()}`, from: 'me', text: (it.caption ?? '').trim(), time: hhmm(new Date()), pending: true, kind,
        localUrl: kind === 'image' ? URL.createObjectURL(it.file) : undefined,
        file: { path: '', name, type, size: it.file.size, seconds: it.voiceSeconds },
      };
    });
    addPending(id, queued);
    const finish = (list: Msg[]) => { list.forEach((m) => { if (m.localUrl) URL.revokeObjectURL(m.localUrl); }); dropPending(id, list.map((m) => m.id!)); };

    let done = 0;
    let error: string | null = null;
    for (const it of items) {
      const up = await uploadChatFile(id, it.file, it.voiceSeconds ? { voiceSeconds: it.voiceSeconds } : {});
      let msg: string | null = null;
      if (!up.file || !up.kind) msg = up.error ?? 'Could not upload the file.';
      else {
        if (up.kind === 'image') void getChatFileUrl(up.file.path); // warm the link so the sent photo shows without a flash
        msg = await postMessage({ conversationId: id, text: (it.caption ?? '').trim(), kind: up.kind, attachment: up.file });
        if (msg) await createClient().storage.from(CHAT_BUCKET).remove([up.file.path]); // nothing was sent, so do not leave the file behind
      }
      if (msg) { error = msg; break; }
      await load();
      finish([queued[done]]);
      done++;
    }
    if (error) finish(queued.slice(done));
    return { error, done };
  }, [load, may, addPending, dropPending]);

  /** forwards one message (text, photo, file or voice) to other conversations; returns an error message or null */
  const forward = useCallback(async (messageId: string, targets: string[]) => {
    if (!canWrite) return PROFILE_LOCKED_MSG;
    const errors: string[] = [];
    for (const t of targets) {
      const e = await postMessage({ conversationId: t, forwardOf: messageId });
      if (e) errors.push(e);
    }
    await load();
    if (!errors.length) return null;
    return targets.length === 1 ? errors[0] : `Forwarded to ${targets.length - errors.length} of ${targets.length} chats. ${errors[0]}`;
  }, [load, canWrite]);

  /** open (or create) a 1:1 chat with a connection; returns the conversation id or an error */
  const start = useCallback(async (otherId: string): Promise<{ id?: string; error?: string }> => {
    if (!canWrite) return { error: PROFILE_LOCKED_MSG };
    const { data, error: err } = await createClient().rpc('start_dm', { other: otherId });
    if (err) return { error: err.message };
    await load();
    return { id: data as string };
  }, [load, canWrite]);

  /** department group chats: admins of that department add / remove members (enforced in the database) */
  const addMember = useCallback(async (conv: string, member: string) => {
    const { error: err } = await createClient().rpc('add_group_member', { conv, member });
    await load();
    return err ? err.message : null;
  }, [load]);
  const removeMember = useCallback(async (conv: string, member: string) => {
    const { error: err } = await createClient().rpc('remove_group_member', { conv, member });
    await load();
    return err ? err.message : null;
  }, [load]);

  /** someone in the department chat takes a ticket; opens the temporary chat and returns its id (or an error message) */
  const takeTicket = useCallback(async (ticketId: string): Promise<{ id?: string; error?: string }> => {
    const { data, error: err } = await createClient().rpc('claim_ticket', { t: ticketId });
    await load();
    return err ? { error: err.message } : { id: data as string };
  }, [load]);

  /** the reporter or the volunteer marks the ticket resolved (done = false takes the mark back); returns an error message or null */
  const resolveTicket = useCallback(async (ticketId: string, done: boolean) => {
    const { error: err } = await createClient().rpc('resolve_ticket', { t: ticketId, done });
    await load();
    return err ? err.message : null;
  }, [load]);

  /* what the pages show: the loaded chats plus the messages still being sent */
  const shown = useMemo(() => chats.map((c) => (pending[c.id]?.length ? { ...c, messages: [...c.messages, ...pending[c.id]] } : c)), [chats, pending]);

  return { chats: shown, unread, markRead, send, sendFiles, forward, start, addMember, removeMember, takeTicket, resolveTicket, loaded, error };
}

export interface NewsInput { title: string; cat: NewsCat; source: string; img: string; excerpt: string; body: string[]; featured: boolean }

/** url-safe slug from the title, with a short random tail so two titles never clash */
const slugify = (title: string) =>
  `${title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '') || 'article'}-${Math.random().toString(36).slice(2, 6)}`;

/** Admins: publish a new article, or update the one with `slug`. Only one article can be featured. */
export async function saveNews(input: NewsInput, slug?: string): Promise<{ slug?: string; error?: string }> {
  const supabase = createClient();
  if (input.featured) {
    const { error } = await supabase.from('news').update({ featured: false }).eq('featured', true).neq('slug', slug ?? '');
    if (error) return { error: error.message };
  }
  if (slug) {
    const { error } = await supabase.from('news').update(input).eq('slug', slug);
    return error ? { error: error.message } : { slug };
  }
  const fresh = slugify(input.title);
  const { error } = await supabase.from('news').insert({ ...input, slug: fresh });
  return error ? { error: error.message } : { slug: fresh };
}

/** Admins: delete an article; returns an error message or null. Pass its photo `img` to remove an uploaded file too. */
export async function deleteNews(slug: string, img?: string) {
  const supabase = createClient();
  const { error } = await supabase.from('news').delete().eq('slug', slug);
  if (error) return error.message;
  // best effort: an uploaded photo (not a stock one) is removed from storage with its article
  const marker = `/storage/v1/object/public/${NEWS_BUCKET}/`;
  if (img && img.includes(marker)) await supabase.storage.from(NEWS_BUCKET).remove([decodeURIComponent(img.split(marker)[1])]);
  return null;
}

const NEWS_BUCKET = 'news-images';

/** Shrinks a photo to at most 1600px wide and re-encodes it as WebP (AGENTS §8), in the browser. */
async function shrinkPhoto(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / bmp.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', 0.8));
  if (!blob) throw new Error('encode');
  return blob;
}

const EVENT_BUCKET = 'event-images';

/** Calendar: upload one event photo (shrunk like news photos); returns its public URL or an error message. */
export async function uploadEventImage(file: File): Promise<{ url?: string; error?: string }> {
  if (!file.type.startsWith('image/')) return { error: 'Please choose an image file (JPG, PNG or WebP).' };
  if (file.size > 15 * 1024 * 1024) return { error: 'That photo is over 15 MB. Please choose a smaller one.' };
  let blob: Blob;
  try { blob = await shrinkPhoto(file); }
  catch { return { error: 'We could not read that photo. Please use a JPG, PNG or WebP image.' }; }
  const supabase = createClient();
  const path = `${crypto.randomUUID()}.${blob.type === 'image/png' ? 'png' : blob.type === 'image/jpeg' ? 'jpg' : 'webp'}`;
  const { error } = await supabase.storage.from(EVENT_BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: '31536000' });
  if (error) return { error: error.message };
  return { url: supabase.storage.from(EVENT_BUCKET).getPublicUrl(path).data.publicUrl };
}

/** Best effort: delete event photos from storage (by their public URLs). Only the uploader's own files are removed by the database. */
export async function removeEventImages(urls: string[]) {
  const marker = `/storage/v1/object/public/${EVENT_BUCKET}/`;
  const paths = urls.filter((u) => u.includes(marker)).map((u) => decodeURIComponent(u.split(marker)[1]));
  if (paths.length) await createClient().storage.from(EVENT_BUCKET).remove(paths);
}

/** Admins: upload a photo for an article; returns its public URL (stored in news.img) or an error message. */
export async function uploadNewsImage(file: File): Promise<{ url?: string; error?: string }> {
  if (!file.type.startsWith('image/')) return { error: 'Please choose an image file (JPG, PNG or WebP).' };
  if (file.size > 15 * 1024 * 1024) return { error: 'That photo is over 15 MB. Please choose a smaller one.' };
  let blob: Blob;
  try { blob = await shrinkPhoto(file); }
  catch { return { error: 'We could not read that photo. Please use a JPG, PNG or WebP image.' }; }
  const supabase = createClient();
  const path = `${crypto.randomUUID()}.${blob.type === 'image/png' ? 'png' : blob.type === 'image/jpeg' ? 'jpg' : 'webp'}`;
  const { error } = await supabase.storage.from(NEWS_BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: '31536000' });
  if (error) return { error: error.message };
  return { url: supabase.storage.from(NEWS_BUCKET).getPublicUrl(path).data.publicUrl };
}

/**
 * Chats: uploads a photo, document or voice message into the conversation's folder of the private chat-files bucket
 * (docs/sql/023_chat_media.sql). Photos are shrunk like news photos. Returns the file details to send with the message.
 */
export async function uploadChatFile(conv: string, file: File | Blob, o: { voiceSeconds?: number } = {}): Promise<{ file?: ChatFile; kind?: ChatKind; error?: string }> {
  let blob: Blob = file;
  let type: string; let ext: string; let name: string; let kind: ChatKind;
  if (o.voiceSeconds) {
    type = baseType(file.type); // "audio/webm;codecs=opus" -> "audio/webm", which is what the bucket list expects
    if (!AUDIO_TYPES.includes(type)) return { error: 'This browser recorded a sound format we cannot send.' };
    ext = audioExt(type); name = `Voice message.${ext}`; kind = 'voice';
    if (file.size > CHAT_MAX_BYTES) return { error: 'That voice message is too big. Please record a shorter one.' };
  } else {
    name = cleanName((file as File).name ?? 'file');
    const bad = checkChatFile({ name, size: file.size });
    if (bad) return { error: bad };
    type = chatMime(name)!; ext = extOf(name);
    if (type.startsWith('image/')) {
      kind = 'image';
      if (type !== 'image/gif') {
        try { blob = await shrinkPhoto(file as File); type = 'image/webp'; ext = 'webp'; }
        catch { return { error: `We could not read "${name}". Please use a JPG, PNG or WebP photo.` }; }
      }
    } else kind = 'file';
  }
  const path = `${conv}/${crypto.randomUUID()}.${ext}`;
  const { error } = await createClient().storage.from(CHAT_BUCKET).upload(path, blob, { contentType: type, cacheControl: '3600' });
  if (error) return { error: error.message };
  return { kind, file: { path, name, type, size: blob.size, seconds: o.voiceSeconds } };
}

const chatUrls = new Map<string, { url: string; at: number }>();
/** the cached link to a chat file, if there is one (so a photo can show on the first render) */
export function peekChatFileUrl(path: string, download?: string): string | undefined {
  const hit = chatUrls.get(`${path}|${download ?? ''}`);
  return hit && Date.now() - hit.at < 50 * 60 * 1000 ? hit.url : undefined;
}
/** A temporary link (valid 1 hour) to a file in the private chat bucket. `download` makes the browser save it under that name. */
export async function getChatFileUrl(path: string, download?: string): Promise<{ url?: string; error?: string }> {
  const key = `${path}|${download ?? ''}`;
  const hit = chatUrls.get(key);
  if (hit && Date.now() - hit.at < 50 * 60 * 1000) return { url: hit.url };
  const { data, error } = await createClient().storage.from(CHAT_BUCKET).createSignedUrl(path, 3600, download ? { download } : undefined);
  if (error || !data) return { error: error?.message ?? 'Could not open the file.' };
  chatUrls.set(key, { url: data.signedUrl, at: Date.now() });
  return { url: data.signedUrl };
}

/** Published articles (Supabase `news` table), newest first, with live updates. Shared by the news page and home. */
export function useNews() {
  const { me } = useMe();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!me.id) return;
    const { data, error: err } = await createClient().from('news').select(NEWS_COLS).order('published_at', { ascending: false });
    if (err) setError(err.message);
    else { setError(null); const now = new Date(); setNews((data ?? []).map((r) => toNews(r, now))); }
    setLoaded(true);
  }, [me.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!me.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`news-${me.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, () => { load(); })
      .subscribe();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      supabase.removeChannel(channel);
    };
  }, [me.id, load]);

  return { news, loaded, error };
}

export interface FeedComment { id: string; who: string; text: string }
/** a pending request to remove a post (visible to whoever asked, the post's author and the super admin) */
export interface DeleteRequest { id: string; who: string; reason: string; mine: boolean }
export interface FeedPost {
  id: string; initials: string; bg: string; name: string; meta: string; body: string; image?: string;
  likes: number; liked: boolean; mine: boolean; comments: FeedComment[]; requests: DeleteRequest[];
}

const FEED_COLS = `id, author_id, as_org, pinned, body, image, created_at,
  author:profiles!posts_author_id_fkey(first_name, last_name),
  post_likes(user_id),
  post_comments(id, body, created_at, author:profiles!post_comments_author_id_fkey(first_name, last_name)),
  post_delete_requests(id, status, reason, requested_by, requester:profiles!post_delete_requests_requested_by_fkey(first_name, last_name))`;


/** Community feed (Supabase `posts`, `post_likes`, `post_comments`, `post_hides`) with live updates. Actions return an error message or null. */
export function useFeed() {
  const { me, canWrite } = useMe();
  const [rows, setRows] = useState<FeedPost[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!me.id) return;
    const supabase = createClient();
    const [p, h] = await Promise.all([
      supabase.from('posts').select(FEED_COLS).order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(50),
      supabase.from('post_hides').select('post_id'),
    ]);
    if (p.error || h.error) { setError((p.error ?? h.error)!.message); setLoaded(true); return; }
    const now = new Date();
    setError(null);
    setHidden((h.data ?? []).map((r) => r.post_id));
    setRows((p.data ?? []).map((r: Record<string, any>) => {
      const name = r.as_org ? 'AU Youth Network' : fullName(r.author);
      const likes: { user_id: string }[] = r.post_likes ?? [];
      const comments = [...(r.post_comments ?? [])]
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((c) => ({ id: c.id, who: fullName(c.author), text: c.body }));
      return {
        id: r.id, name, initials: r.as_org ? 'AU' : initialsOf(name), bg: r.as_org ? '#032210' : colorFor(r.author_id),
        meta: `${timeAgo(r.created_at, now)} · ${r.pinned ? 'Pinned' : 'Public'}`, body: r.body, image: r.image ?? undefined,
        likes: likes.length, liked: likes.some((l) => l.user_id === me.id), mine: r.author_id === me.id, comments,
        requests: (r.post_delete_requests ?? []).filter((q: Record<string, any>) => q.status === 'pending')
          .map((q: Record<string, any>) => ({ id: q.id, who: fullName(q.requester), reason: q.reason ?? '', mine: q.requested_by === me.id })),
      };
    }));
    setLoaded(true);
  }, [me.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!me.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`feed-${me.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => { load(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, () => { load(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments' }, () => { load(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_delete_requests' }, () => { load(); })
      .subscribe();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      supabase.removeChannel(channel);
    };
  }, [me.id, load]);

  const posts = useMemo(() => rows.filter((p) => !hidden.includes(p.id)), [rows, hidden]);

  const run = useCallback(async (op: PromiseLike<{ error: { message: string } | null }>) => {
    const { error: err } = await op;
    await load();
    return err ? err.message : null;
  }, [load]);

  const publish = useCallback((body: string) => canWrite
    ? run(createClient().from('posts').insert({ author_id: me.id, body })) : Promise.resolve(PROFILE_LOCKED_MSG), [me.id, canWrite, run]);
  const remove = useCallback((id: string) => run(createClient().from('posts').delete().eq('id', id)), [run]);
  const toggleLike = useCallback((p: FeedPost) => !canWrite ? Promise.resolve(PROFILE_LOCKED_MSG) : run(p.liked
    ? createClient().from('post_likes').delete().eq('post_id', p.id).eq('user_id', me.id)
    : createClient().from('post_likes').insert({ post_id: p.id, user_id: me.id })), [me.id, canWrite, run]);
  const comment = useCallback((postId: string, body: string) => canWrite
    ? run(createClient().from('post_comments').insert({ post_id: postId, author_id: me.id, body })) : Promise.resolve(PROFILE_LOCKED_MSG), [me.id, canWrite, run]);
  const hide = useCallback((id: string) => run(createClient().from('post_hides').insert({ post_id: id, user_id: me.id })), [me.id, run]);
  const unhideAll = useCallback(() => run(createClient().from('post_hides').delete().eq('user_id', me.id)), [me.id, run]);
  /** admins: ask for someone else's post to be removed; the author or the super admin decides */
  const requestDelete = useCallback((postId: string, reason: string) =>
    run(createClient().from('post_delete_requests').insert({ post_id: postId, requested_by: me.id, reason })), [me.id, run]);
  /** keep the post (approving a request = deleting the post with remove) */
  const decline = useCallback((requestId: string) =>
    run(createClient().from('post_delete_requests').update({ status: 'declined' }).eq('id', requestId)), [run]);

  return { posts, total: rows.length, loaded, error, publish, remove, toggleLike, comment, hide, unhideAll, requestDelete, decline };
}

export interface Notif { id: string; icon: string; bg: string; fg: string; title: string; body: string; time: string; href: string; read: boolean }

/** icon tile per notification kind (soft tints, like the rest of the dashboard) */
const NOTIF_LOOK: Record<string, { icon: string; bg: string; fg: string }> = {
  news: { icon: 'AU', bg: '#ECECE8', fg: '#1E2A22' },
  connection_request: { icon: '+', bg: '#F3EEE4', fg: '#8a6a3c' },
  connection_accepted: { icon: '✓', bg: '#E8EEE9', fg: '#2F4A3A' },
  post_comment: { icon: '💬', bg: '#F3EEE4', fg: '#8a6a3c' },
  delete_request: { icon: '!', bg: '#F4E8EC', fg: '#8F2D56' },
  flagged_message: { icon: '!', bg: '#F4E8EC', fg: '#8F2D56' },
  new_department: { icon: '+', bg: '#ECECE8', fg: '#1E2A22' },
  ticket: { icon: '#', bg: '#F3EEE4', fg: '#8a6a3c' },
  chat_message: { icon: '💬', bg: '#E8EEE9', fg: '#2F4A3A' },
};

/** Your latest notifications (Supabase `notifications`, written by database triggers) with live updates. */
export function useNotifications() {
  const { me } = useMe();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);   // all unread, not just the 8 shown
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!me.id) return;
    const supabase = createClient();
    const [{ data, error: err }, { count }] = await Promise.all([
      supabase.from('notifications')
        .select('id, kind, title, body, href, read_at, created_at').order('created_at', { ascending: false }).limit(8),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null),
    ]);
    if (err) { setError(err.message); setLoaded(true); return; }
    setUnread(count ?? 0);
    const now = new Date();
    setError(null);
    setNotifs((data ?? []).map((r) => ({
      id: r.id, ...(NOTIF_LOOK[r.kind] ?? NOTIF_LOOK.news), title: r.title, body: r.body,
      href: r.href, time: timeAgo(r.created_at, now), read: !!r.read_at,
    })));
    setLoaded(true);
  }, [me.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!me.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`notifs-${me.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${me.id}` }, () => { load(); })
      .subscribe();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      supabase.removeChannel(channel);
    };
  }, [me.id, load]);

  const markRead = useCallback(async (id: string) => {
    setNotifs((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((c) => Math.max(0, c - 1));
    await createClient().from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).is('read_at', null);
  }, []);
  const markAllRead = useCallback(async () => {
    if (!me.id) return;
    setNotifs((p) => p.map((n) => ({ ...n, read: true })));
    setUnread(0);
    await createClient().from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', me.id).is('read_at', null);
  }, [me.id]);

  return { notifs, unread, markRead, markAllRead, loaded, error };
}

/** Role pick-list (Supabase `member_roles`, SQL 032). A role typed on the profile that isn't listed is added by the database. */
export const BASE_ROLES = ['Intern', 'Fellow', 'Volunteer'];
export function useRoles() {
  const [roles, setRoles] = useState<string[]>(BASE_ROLES);   // shown until the list loads (or if SQL 032 is not run yet)
  useEffect(() => {
    let alive = true;
    createClient().from('member_roles').select('name').order('created_at').then(({ data }) => {
      if (alive && data?.length) setRoles(data.map((r) => r.name));
    });
    return () => { alive = false; };
  }, []);
  return roles;
}

/** Department pick-list (Supabase `departments`). A name typed on the profile that isn't listed is added by the database. */
export function useDepartments() {
  const [departments, setDepartments] = useState<string[]>([]);
  useEffect(() => {
    let alive = true;
    createClient().from('departments').select('name').order('name').then(({ data }) => {
      if (alive) setDepartments((data ?? []).map((r) => r.name));
    });
    return () => { alive = false; };
  }, []);
  return departments;
}

export type TicketStatus = 'open' | 'in_progress' | 'closed';
export interface Ticket {
  id: string; code: string; title: string; description: string; urgency: string; status: TicketStatus;
  who: string; whoDept: string; mine: boolean; time: string;
  /** the department asked to fix it; null = the admins still have to pick one */
  dept: string | null;
  /** the person who took it ('' until someone does) */
  assignee: string;
  /** the live ticket chat you are in (null before it opens and once it has expired) */
  chatId: string | null;
}

/**
 * Support tickets (Supabase `support_tickets`, docs/sql/029_ticket_workflow.sql). You get your own, the ones sent to your
 * department chat and the ones you took; admins get everyone's. Filing and routing go through database functions.
 * Actions return an error message or null.
 */
export function useTickets() {
  const { me } = useMe();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!me.id) return;
    const { data, error: err } = await createClient().from('support_tickets')
      .select(`${TICKET_COLS}, created_at, dept:departments(name), chat:conversations!conversations_ticket_id_fkey(id)`)
      .order('created_at', { ascending: false }).limit(100);
    if (err) { setError(err.message); setLoaded(true); return; }
    const now = new Date();
    setError(null);
    setTickets((data ?? []).map((r: Record<string, any>) => {
      const info = toTicketInfo(r, me.id);
      const chat = Array.isArray(r.chat) ? r.chat[0] : r.chat;   // hidden by the database for people outside the chat and once it has expired
      return {
        id: r.id, code: info.code, title: info.title, description: info.description, urgency: info.urgency, status: r.status,
        who: info.reporter, whoDept: info.reporterDept, mine: r.user_id === me.id, time: timeAgo(r.created_at, now),
        dept: r.dept?.name ?? null, assignee: info.assignee, chatId: chat?.id ?? null,
      };
    }));
    setLoaded(true);
  }, [me.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!me.id) return;
    const supabase = createClient();
    const channel = supabase.channel(`tickets-${me.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => { load(); })
      .subscribe();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      supabase.removeChannel(channel);
    };
  }, [me.id, load]);

  const run = useCallback(async (op: PromiseLike<{ error: { message: string } | null }>) => {
    const { error: err } = await op;
    await load();
    return err ? err.message : null;
  }, [load]);

  /** deptId = the department that should fix it, or null to let the admins decide */
  const file = useCallback((title: string, urgency: string, description: string, deptId: string | null) =>
    run(createClient().rpc('create_ticket', { p_title: title, p_description: description, p_urgency: urgency, p_dept: deptId })), [run]);
  /** admins: pick the department for a ticket nobody routed; its card then appears in that department's chat */
  const route = useCallback((id: string, deptId: string) =>
    run(createClient().rpc('route_ticket', { t: id, p_dept: deptId })), [run]);

  return { tickets, loaded, error, file, route };
}

export interface DepartmentOption { id: string; name: string }

/** Department pick-list with ids (for choosing which department fixes a ticket). */
export function useDepartmentOptions() {
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  useEffect(() => {
    let alive = true;
    createClient().from('departments').select('id, name').order('name').then(({ data }) => {
      if (alive) setDepartments((data ?? []) as DepartmentOption[]);
    });
    return () => { alive = false; };
  }, []);
  return departments;
}

export interface ArchivedTicket {
  id: string; code: string; title: string; status: TicketStatus; dept: string; reporter: string; assignee: string;
  created: string; closedAt: string | null; expiresAt: string | null; messages: number;
}
export interface ArchivedMessage { id: string; senderId: string; who: string; body: string; kind: string; file: string; at: string }

/** Admins: find a ticket chat and read it (read-only; every opening is logged in `ticket_chat_access`). Nothing loads until it is called. */
export function useTicketArchive() {
  const search = useCallback(async (q: string, offset = 0, limit = 20): Promise<{ rows: ArchivedTicket[]; error?: string }> => {
    const { data, error: err } = await createClient().rpc('search_ticket_chats', { q, lim: limit, off: offset });
    if (err) return { rows: [], error: err.message };
    return {
      rows: (data ?? []).map((r: Record<string, any>) => ({
        id: r.t_id, code: ticketCode(Number(r.t_no)), title: r.t_title, status: r.t_status as TicketStatus, dept: r.t_dept ?? 'No department',
        reporter: r.t_reporter ?? 'Member', assignee: r.t_assignee ?? '', created: r.t_created, closedAt: r.t_closed ?? null,
        expiresAt: r.t_expires ?? null, messages: Number(r.t_messages),
      })),
    };
  }, []);

  const read = useCallback(async (ticketId: string): Promise<{ messages: ArchivedMessage[]; error?: string }> => {
    const { data, error: err } = await createClient().rpc('read_ticket_chat', { t: ticketId });
    if (err) return { messages: [], error: err.message };
    return {
      messages: (data ?? []).map((r: Record<string, any>) => ({
        id: r.m_id, senderId: r.m_sender_id, who: r.m_sender ?? 'Member', body: r.m_body ?? '', kind: r.m_kind ?? 'text', file: r.m_file ?? '', at: r.m_at,
      })),
    };
  }, []);

  return { search, read };
}

export interface PendingDelete {
  id: string; postId: string; post: string; author: string; who: string; reason: string; time: string;
  /** you asked (so you wait), or you can decide (your post, or you are the super admin) */
  mine: boolean; canDecide: boolean;
}

/** Pending post deletion requests you can see (Supabase `post_delete_requests`), with live updates. */
export function useDeleteRequests() {
  const { me } = useMe();
  const [requests, setRequests] = useState<PendingDelete[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!me.id) return;
    const { data, error: err } = await createClient().from('post_delete_requests')
      .select(`id, post_id, reason, requested_by, created_at,
        requester:profiles!post_delete_requests_requested_by_fkey(first_name, last_name),
        post:posts!post_delete_requests_post_id_fkey(body, author_id, author:profiles!posts_author_id_fkey(first_name, last_name))`)
      .eq('status', 'pending').order('created_at', { ascending: false });
    if (err) { setError(err.message); setLoaded(true); return; }
    const now = new Date();
    setError(null);
    setRequests((data ?? []).map((r: Record<string, any>) => ({
      id: r.id, postId: r.post_id, post: r.post?.body ?? '', author: fullName(r.post?.author ?? null),
      who: fullName(r.requester), reason: r.reason ?? '', time: timeAgo(r.created_at, now),
      mine: r.requested_by === me.id, canDecide: me.access === 'super_admin' || r.post?.author_id === me.id,
    })));
    setLoaded(true);
  }, [me.id, me.access]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!me.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`delete-requests-${me.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_delete_requests' }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [me.id, load]);

  const run = useCallback(async (op: PromiseLike<{ error: { message: string } | null }>) => {
    const { error: err } = await op;
    await load();
    return err ? err.message : null;
  }, [load]);

  /** approving = deleting the post (the request goes with it) */
  const approve = useCallback((postId: string) => run(createClient().from('posts').delete().eq('id', postId)), [run]);
  const decline = useCallback((id: string) =>
    run(createClient().from('post_delete_requests').update({ status: 'declined' }).eq('id', id)), [run]);

  return { requests, loaded, error, approve, decline };
}

export interface AddedDepartment { id: string; name: string; who: string; time: string }

/** Departments members typed in themselves (not on the official list). The super admin can remove them. */
export function useAddedDepartments() {
  const { me } = useMe();
  const [departments, setDepartments] = useState<AddedDepartment[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!me.id) return;
    const { data } = await createClient().from('departments')
      .select('id, name, created_at, adder:profiles!departments_added_by_fkey(first_name, last_name)')
      .not('added_by', 'is', null).order('created_at', { ascending: false });
    const now = new Date();
    setDepartments((data ?? []).map((r: Record<string, any>) => ({ id: r.id, name: r.name, who: fullName(r.adder), time: timeAgo(r.created_at, now) })));
    setLoaded(true);
  }, [me.id]);

  useEffect(() => { load(); }, [load]);

  const remove = useCallback(async (id: string) => {
    const { error: err } = await createClient().from('departments').delete().eq('id', id);
    await load();
    return err ? err.message : null;
  }, [load]);

  return { departments, loaded, remove };
}

export interface Faq { id: string; question: string; answer: string }

/** Get Help FAQs (Supabase `faqs`). Everyone reads; admins add, edit and delete. Actions return an error message or null. */
export function useFaqs() {
  const { me } = useMe();
  const [faqs, setFaqs] = useState<(Faq & { position: number })[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!me.id) return;
    const { data, error: err } = await createClient().from('faqs').select('id, question, answer, position').order('position').order('created_at');
    if (err) setError(err.message);
    else { setError(null); setFaqs((data ?? []) as (Faq & { position: number })[]); }
    setLoaded(true);
  }, [me.id]);

  useEffect(() => { load(); }, [load]);

  const run = useCallback(async (op: PromiseLike<{ error: { message: string } | null }>) => {
    const { error: err } = await op;
    await load();
    return err ? err.message : null;
  }, [load]);

  const add = useCallback((question: string, answer: string) =>
    run(createClient().from('faqs').insert({ question, answer, position: Math.max(0, ...faqs.map((f) => f.position)) + 1 })), [run, faqs]);
  const update = useCallback((id: string, question: string, answer: string) =>
    run(createClient().from('faqs').update({ question, answer }).eq('id', id)), [run]);
  const remove = useCallback((id: string) =>
    run(createClient().from('faqs').delete().eq('id', id)), [run]);

  return { faqs: faqs as Faq[], loaded, error, add, update, remove };
}

export interface FlaggedMessage { id: string; who: string; body: string; categories: string[]; time: string; reviewed: boolean }

/** Messages the AI blocked in chats (Supabase `moderation_flags`, admins only), with live updates. */
export function useFlaggedMessages() {
  const { me } = useMe();
  const [flags, setFlags] = useState<FlaggedMessage[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!me.id || me.access === 'user') return;
    const { data } = await createClient().from('moderation_flags')
      .select('id, body, categories, created_at, reviewed_at, sender:profiles!moderation_flags_sender_id_fkey(first_name, last_name)')
      .order('created_at', { ascending: false }).limit(100);
    const now = new Date();
    setFlags((data ?? []).map((r: Record<string, any>) => ({
      id: r.id, who: fullName(r.sender), body: r.body, categories: r.categories ?? [],
      time: timeAgo(r.created_at, now), reviewed: !!r.reviewed_at,
    })));
    setLoaded(true);
  }, [me.id, me.access]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!me.id || me.access === 'user') return;
    const supabase = createClient();
    const channel = supabase.channel(`flags-${me.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'moderation_flags' }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [me.id, me.access, load]);

  const markReviewed = useCallback(async (id: string) => {
    const { error: err } = await createClient().from('moderation_flags')
      .update({ reviewed_at: new Date().toISOString(), reviewed_by: me.id }).eq('id', id);
    await load();
    return err ? err.message : null;
  }, [me.id, load]);

  return { flags, loaded, markReviewed };
}

export interface DeptChatRow { id: string; dept: string; count: number }

/** Super admin overview of every department chat (members only, never messages). Actions return an error message or null. */
export function useDeptChatAdmin() {
  const { me } = useMe();
  const [chats, setChats] = useState<DeptChatRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (me.access !== 'super_admin') return;
    const { data } = await createClient().rpc('list_dept_chats');
    setChats((data ?? []).map((r: Record<string, any>) => ({ id: r.conv_id, dept: r.dept_name, count: Number(r.member_count) })));
    setLoaded(true);
  }, [me.access]);

  useEffect(() => { load(); }, [load]);

  const membersOf = useCallback(async (conv: string): Promise<{ id: string; name: string }[]> => {
    const { data } = await createClient().rpc('list_group_members', { conv });
    return (data ?? []).map((r: Record<string, any>) => ({ id: r.user_id, name: fullName(r) }));
  }, []);

  const addMember = useCallback(async (conv: string, member: string) => {
    const { error: err } = await createClient().rpc('add_group_member', { conv, member });
    await load();
    return err ? err.message : null;
  }, [load]);

  const removeMember = useCallback(async (conv: string, member: string) => {
    const { error: err } = await createClient().rpc('remove_group_member', { conv, member });
    await load();
    return err ? err.message : null;
  }, [load]);

  return { chats, loaded, membersOf, addMember, removeMember };
}
