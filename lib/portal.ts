'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CHATS, sortEvents, type CalEvent, type EventType, type Msg, type NewsItem } from './data';
import { useMe } from './me';
import { NEWS_COLS, timeAgo, toNews } from './news';
import { colorFor } from './people';
import { createClient } from './supabase/client';
import { usePersisted } from './store';

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

/** Chat read-state + messages the user sent, shared by the header badge and the chats page. */
export function useChats() {
  const [read, setRead] = usePersisted<string[]>('auy-chats-read', []);
  const [sent, setSent] = usePersisted<Record<string, Msg[]>>('auy-chats-sent', {});
  const chats = useMemo(() => CHATS.map((c) => {
    const messages = [...c.messages, ...(sent[c.id] ?? [])];
    const last = messages[messages.length - 1];
    return { ...c, messages, unread: read.includes(c.id) ? 0 : c.unread, preview: last?.text ?? '', time: sent[c.id]?.length ? last.time : c.time };
  }), [read, sent]);
  const unread = chats.reduce((n, c) => n + c.unread, 0);
  const markRead = useCallback((id: string) => setRead((p) => (p.includes(id) ? p : [...p, id])), [setRead]);
  const send = useCallback((id: string, text: string) => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setSent((p) => ({ ...p, [id]: [...(p[id] ?? []), { from: 'me', text, time }] }));
  }, [setSent]);
  return { chats, unread, markRead, send };
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

const fullName = (p: { first_name?: string | null; last_name?: string | null } | null) =>
  `${(p?.first_name ?? '').trim()} ${(p?.last_name ?? '').trim()}`.trim() || 'Member';
const initialsOf = (name: string) => name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

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
