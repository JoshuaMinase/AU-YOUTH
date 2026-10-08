'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MONTHS, WEEKDAYS, sortEvents, startOfDay, type CalEvent, type Chat, type EventType, type Msg, type NewsItem } from './data';
import { useMe } from './me';
import { NEWS_COLS, timeAgo, toNews } from './news';
import { colorFor } from './people';
import { createClient } from './supabase/client';

export type EventInput = Omit<CalEvent, 'id'>;

function toEvent(r: Record<string, any>): CalEvent {
  return {
    id: r.id, date: r.date, time: String(r.time ?? '').slice(0, 5),
    title: r.title, type: r.type as EventType, location: r.location ?? 'TBC',
  };
}

/** The signed-in member's own events (Supabase `events` table), with add / update / remove. Actions return an error message or null. */
export function useEvents(today: Date | null) {
  const { me } = useMe();
  const [rows, setRows] = useState<CalEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!me.id) return;
    const { data, error: err } = await createClient().from('events').select('id, date, time, title, type, location').eq('user_id', me.id);
    if (err) setError(err.message);
    else { setError(null); setRows((data ?? []).map(toEvent)); }
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
    return run(createClient().from('events').insert({ ...e, user_id: me.id }));
  }, [me.id, run]);
  const update = useCallback((id: string, e: EventInput) =>
    run(createClient().from('events').update(e).eq('id', id)), [run]);
  const remove = useCallback((id: string) =>
    run(createClient().from('events').delete().eq('id', id)), [run]);

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

const CHAT_COLS = `id, is_group, title, last_message_at,
  conversation_members(user_id, last_read_at, profile:profiles!conversation_members_user_id_fkey(first_name, last_name)),
  messages(id, sender_id, body, created_at)`;

/**
 * Your conversations (Supabase `conversations`, `conversation_members`, `messages`) with live updates.
 * Shared by the header badge, the chats page and home quick chat. send/markRead return an error message or null.
 */
export function useChats() {
  const { me } = useMe();
  const [chats, setChats] = useState<(Chat & { preview: string })[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!me.id) return;
    const { data, error: err } = await createClient().from('conversations').select(CHAT_COLS)
      .order('last_message_at', { ascending: false })
      .order('created_at', { referencedTable: 'messages', ascending: false })
      .limit(200, { referencedTable: 'messages' });
    if (err) { setError(err.message); setLoaded(true); return; }
    const now = new Date();
    setError(null);
    setChats((data ?? []).map((r: Record<string, any>): Chat & { preview: string } => {
      const members: { user_id: string; last_read_at: string; profile: { first_name: string | null; last_name: string | null } | null }[] = r.conversation_members ?? [];
      const mine = members.find((m) => m.user_id === me.id);
      const other = members.find((m) => m.user_id !== me.id);
      const name = r.is_group ? r.title ?? 'Group' : fullName(other?.profile ?? null);
      const names = Object.fromEntries(members.map((m) => [m.user_id, fullName(m.profile)]));
      const rows: Record<string, any>[] = [...(r.messages ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
      const messages: Msg[] = rows.map((m) => ({
        id: m.id, from: m.sender_id === me.id ? 'me' : 'them', text: m.body, time: hhmm(new Date(m.created_at)),
        who: r.is_group && m.sender_id !== me.id ? names[m.sender_id] ?? 'Member' : undefined,
      }));
      const last = rows[rows.length - 1];
      return {
        id: r.id, name, group: !!r.is_group,
        initials: r.is_group ? 'AU' : initialsOf(name), color: r.is_group ? '#032210' : colorFor(other?.user_id ?? r.id),
        unread: rows.filter((m) => m.sender_id !== me.id && (!mine || m.created_at > mine.last_read_at)).length,
        time: chatTime(last?.created_at ?? r.last_message_at, now), messages,
        preview: last ? last.body : 'No messages yet',
      };
    }));
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
    await load();
    return null;
  }, [me.id, load]);

  const send = useCallback(async (id: string, text: string) => {
    const { error: err } = await createClient().from('messages').insert({ conversation_id: id, sender_id: me.id, body: text });
    await load();
    return err ? err.message : null;
  }, [me.id, load]);

  /** open (or create) a 1:1 chat with a connection; returns the conversation id or an error */
  const start = useCallback(async (otherId: string): Promise<{ id?: string; error?: string }> => {
    const { data, error: err } = await createClient().rpc('start_dm', { other: otherId });
    if (err) return { error: err.message };
    await load();
    return { id: data as string };
  }, [load]);

  return { chats, unread, markRead, send, start, loaded, error };
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
export interface FeedPost {
  id: string; initials: string; bg: string; name: string; meta: string; body: string; image?: string;
  likes: number; liked: boolean; mine: boolean; comments: FeedComment[];
}

const FEED_COLS = `id, author_id, as_org, pinned, body, image, created_at,
  author:profiles!posts_author_id_fkey(first_name, last_name),
  post_likes(user_id),
  post_comments(id, body, created_at, author:profiles!post_comments_author_id_fkey(first_name, last_name))`;


/** Community feed (Supabase `posts`, `post_likes`, `post_comments`, `post_hides`) with live updates. Actions return an error message or null. */
export function useFeed() {
  const { me } = useMe();
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

  const publish = useCallback((body: string) => run(createClient().from('posts').insert({ author_id: me.id, body })), [me.id, run]);
  const remove = useCallback((id: string) => run(createClient().from('posts').delete().eq('id', id)), [run]);
  const toggleLike = useCallback((p: FeedPost) => run(p.liked
    ? createClient().from('post_likes').delete().eq('post_id', p.id).eq('user_id', me.id)
    : createClient().from('post_likes').insert({ post_id: p.id, user_id: me.id })), [me.id, run]);
  const comment = useCallback((postId: string, body: string) =>
    run(createClient().from('post_comments').insert({ post_id: postId, author_id: me.id, body })), [me.id, run]);
  const hide = useCallback((id: string) => run(createClient().from('post_hides').insert({ post_id: id, user_id: me.id })), [me.id, run]);
  const unhideAll = useCallback(() => run(createClient().from('post_hides').delete().eq('user_id', me.id)), [me.id, run]);

  return { posts, total: rows.length, loaded, error, publish, remove, toggleLike, comment, hide, unhideAll };
}

export interface Notif { id: string; icon: string; bg: string; fg: string; title: string; body: string; time: string; href: string; read: boolean }

/** icon tile per notification kind (soft tints, like the rest of the dashboard) */
const NOTIF_LOOK: Record<string, { icon: string; bg: string; fg: string }> = {
  news: { icon: 'AU', bg: '#ECECE8', fg: '#1E2A22' },
  connection_request: { icon: '+', bg: '#F3EEE4', fg: '#8a6a3c' },
  connection_accepted: { icon: '✓', bg: '#E8EEE9', fg: '#2F4A3A' },
  post_comment: { icon: '💬', bg: '#F3EEE4', fg: '#8a6a3c' },
};

/** Your latest notifications (Supabase `notifications`, written by database triggers) with live updates. */
export function useNotifications() {
  const { me } = useMe();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!me.id) return;
    const { data, error: err } = await createClient().from('notifications')
      .select('id, kind, title, body, href, read_at, created_at').order('created_at', { ascending: false }).limit(8);
    if (err) { setError(err.message); setLoaded(true); return; }
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => { load(); })
      .subscribe();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      supabase.removeChannel(channel);
    };
  }, [me.id, load]);

  const unread = notifs.filter((n) => !n.read).length;

  const markRead = useCallback(async (id: string) => {
    setNotifs((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await createClient().from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).is('read_at', null);
  }, []);
  const markAllRead = useCallback(async () => {
    if (!me.id) return;
    setNotifs((p) => p.map((n) => ({ ...n, read: true })));
    await createClient().from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', me.id).is('read_at', null);
  }, [me.id]);

  return { notifs, unread, markRead, markAllRead, loaded, error };
}
