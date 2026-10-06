'use client';
import { useCallback, useMemo } from 'react';
import { buildEvents, CHATS, sortEvents, type CalEvent, type Msg } from './data';
import { usePersisted } from './store';

/** Seed events (relative to today) + events the user added on the calendar page. */
export function useEvents(today: Date | null) {
  const [custom, setCustom] = usePersisted<CalEvent[]>('auy-events', []);
  const events = useMemo(() => (today ? [...buildEvents(today), ...custom].sort(sortEvents) : []), [today, custom]);
  const add = useCallback((e: Omit<CalEvent, 'id'>) => setCustom((p) => [...p, { ...e, id: `u-${Date.now()}` }]), [setCustom]);
  const remove = useCallback((id: string) => setCustom((p) => p.filter((x) => x.id !== id)), [setCustom]);
  return { events, add, remove };
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
