'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PROFILE_LOCKED_MSG, type Access } from '@/lib/data';
import { useMe } from '@/lib/me';
import { createClient } from '@/lib/supabase/client';

export interface Member {
  id: string; name: string; initials: string; role: string; dept: string; place: string; color: string; access: Access;
}
export type Relation = 'none' | 'sent' | 'incoming' | 'connected';

const PALETTE = ['#C9AB5C', '#117302', '#0072C6', '#8F2D56', '#218380', '#FBB13C', '#73D2DE', '#032210'];
/** stable avatar colour per member id (People, feed) */
export const colorFor = (id: string) => PALETTE[[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % PALETTE.length];

function toMember(r: Record<string, any>, access: Access = 'user'): Member {
  const first = (r.first_name ?? '').trim();
  const last = (r.last_name ?? '').trim();
  const name = `${first} ${last}`.trim() || 'Member';
  const initials = ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || 'M';
  return {
    id: r.id, name, initials, role: r.role ?? '', dept: r.dept ?? '',
    place: (r.based_in || r.nationality || '').trim(), color: colorFor(r.id), access,
  };
}

interface Conn { id: string; requester_id: string; addressee_id: string; status: 'pending' | 'accepted' }

/** Real members (everyone except you) and your connections, with actions that write to Supabase. */
export function usePeople() {
  const { me, canWrite } = useMe();
  const [members, setMembers] = useState<Member[]>([]);
  const [conns, setConns] = useState<Conn[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!me.id) return;
    const supabase = createClient();
    const [p, c, a] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name, role, dept, nationality, based_in').neq('id', me.id),
      supabase.from('connections').select('id, requester_id, addressee_id, status'),
      supabase.from('admins').select('user_id, role'),
    ]);
    if (p.error || c.error || a.error) setError((p.error ?? c.error ?? a.error)!.message);
    else setError(null);
    const access = Object.fromEntries((a.data ?? []).map((r) => [r.user_id, r.role as Access]));
    setMembers((p.data ?? []).map((r) => toMember(r, access[r.id])).sort((x, y) => x.name.localeCompare(y.name)));
    setConns((c.data ?? []) as Conn[]);
    setLoaded(true);
  }, [me.id]);

  useEffect(() => { load(); }, [load]);

  // Live updates: reload whenever a connection or profile changes, and when the tab regains focus.
  useEffect(() => {
    if (!me.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`people-${me.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, () => { load(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => { load(); })
      .subscribe();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      supabase.removeChannel(channel);
    };
  }, [me.id, load]);

  const rel = useMemo(() => {
    const map: Record<string, { relation: Relation; connId?: string }> = {};
    for (const c of conns) {
      const other = c.requester_id === me.id ? c.addressee_id : c.requester_id;
      const relation: Relation = c.status === 'accepted' ? 'connected' : c.requester_id === me.id ? 'sent' : 'incoming';
      map[other] = { relation, connId: c.id };
    }
    return map;
  }, [conns, me.id]);

  const relationOf = (id: string): Relation => rel[id]?.relation ?? 'none';

  const run = useCallback(async (op: PromiseLike<{ error: { message: string } | null }>) => {
    const { error: err } = await op;
    await load();
    return err ? err.message : null;
  }, [load]);

  const request = (id: string) => !canWrite ? Promise.resolve(PROFILE_LOCKED_MSG) :
    run(createClient().from('connections').insert({ requester_id: me.id, addressee_id: id }));
  /** withdraw a sent request, decline an incoming one, or remove a connection */
  const remove = (id: string) =>
    rel[id]?.connId ? run(createClient().from('connections').delete().eq('id', rel[id].connId!)) : Promise.resolve(null);
  const accept = (id: string) => !canWrite ? Promise.resolve(PROFILE_LOCKED_MSG) :
    rel[id]?.connId ? run(createClient().from('connections').update({ status: 'accepted' }).eq('id', rel[id].connId!)) : Promise.resolve(null);

  /** open (or create) a 1:1 chat with a connection (Supabase `start_dm`); returns the conversation id or an error */
  const message = async (id: string): Promise<{ chatId?: string; error?: string }> => {
    if (!canWrite) return { error: PROFILE_LOCKED_MSG };
    const { data, error: err } = await createClient().rpc('start_dm', { other: id });
    return err ? { error: err.message } : { chatId: data as string };
  };

  /** super admin only (checked again by `set_admin` in Supabase) */
  const setAdmin = (id: string, make: boolean) => run(createClient().rpc('set_admin', { target: id, make }));

  const incoming = members.filter((m) => relationOf(m.id) === 'incoming');
  const connected = members.filter((m) => relationOf(m.id) === 'connected');

  return { members, incoming, connected, relationOf, request, remove, accept, message, setAdmin, loaded, error };
}
