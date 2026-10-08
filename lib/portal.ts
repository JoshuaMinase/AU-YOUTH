'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CHATS, sortEvents, type CalEvent, type EventType, type Msg } from './data';
import { useMe } from './me';
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
