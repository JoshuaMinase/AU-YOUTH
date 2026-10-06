'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tiny persisted state shared between components (header badge ↔ chats page, calendar ↔ home…).
 * Values live in localStorage so the demo survives reloads; every hook using the same key
 * stays in sync. Falls back to in-memory if storage is unavailable.
 */
const cache = new Map<string, unknown>();
const subs = new Map<string, Set<(v: unknown) => void>>();

function read<T>(key: string, initial: T): T {
  if (cache.has(key)) return cache.get(key) as T;
  let v = initial;
  try { const raw = localStorage.getItem(key); if (raw != null) v = JSON.parse(raw) as T; } catch { /* storage blocked */ }
  cache.set(key, v);
  return v;
}

export function usePersisted<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const init = useRef(initial);
  const [val, setVal] = useState<T>(initial);

  useEffect(() => {
    setVal(read(key, init.current));
    const set = subs.get(key) ?? new Set();
    subs.set(key, set);
    const fn = (v: unknown) => setVal(v as T);
    set.add(fn);
    return () => { set.delete(fn); };
  }, [key]);

  const update = useCallback((v: T | ((prev: T) => T)) => {
    const prev = read(key, init.current);
    const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
    cache.set(key, next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* storage blocked */ }
    subs.get(key)?.forEach((fn) => fn(next));
  }, [key]);

  return [val, update];
}

/** toggle an id in a persisted string list */
export const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
