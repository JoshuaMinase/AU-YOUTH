'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMe } from '@/lib/me';
import { createClient } from '@/lib/supabase/client';

export interface Member {
  id: string; name: string; initials: string; role: string; dept: string; place: string; color: string;
}
export type Relation = 'none' | 'sent' | 'incoming' | 'connected';

const PALETTE = ['#C9AB5C', '#117302', '#0072C6', '#8F2D56', '#218380', '#FBB13C', '#73D2DE', '#032210'];
const colorFor = (id: string) => PALETTE[[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % PALETTE.length];

function toMember(r: Record<string, any>): Member {
  const first = (r.first_name ?? '').trim();
  const last = (r.last_name ?? '').trim();
  const name = `${first} ${last}`.trim() || 'Member';
  const initials = ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || 'M';
  return {
    id: r.id, name, initials, role: r.role ?? '', dept: r.dept ?? '',
    place: (r.based_in || r.nationality || '').trim(), color: colorFor(r.id),
  };
}

interface Conn { id: string; requester_id: string; addressee_id: string; status: 'pending' | 'accepted' }

/** Real members (everyone except you) and your connections, with actions that write to Supabase. */
export function usePeople() {
  const { me } = useMe();
  const [members, setMembers] = useState<Member[]>([]);
  const [conns, setConns] = useState<Conn[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!me.id) return;
    const supabase = createClient();
    const [p, c] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name, role, dept, nationality, based_in').neq('id', me.id),
      supabase.from('connections').select('id, requester_id, addressee_id, status'),
    ]);
    if (p.error || c.error) setError((p.error ?? c.error)!.message);
    else setError(null);
    setMembers((p.data ?? []).map(toMember).sort((a, b) => a.name.localeCompare(b.name)));
    setConns((c.data ?? []) as Conn[]);
    setLoaded(true);
  }, [me.id]);

  useEffect(() => { load(); }, [load]);

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

  const request = (id: string) =>
    run(createClient().from('connections').insert({ requester_id: me.id, addressee_id: id }));
  /** withdraw a sent request, decline an incoming one, or remove a connection */
  const remove = (id: string) =>
    rel[id]?.connId ? run(createClient().from('connections').delete().eq('id', rel[id].connId!)) : Promise.resolve(null);
  const accept = (id: string) =>
    rel[id]?.connId ? run(createClient().from('connections').update({ status: 'accepted' }).eq('id', rel[id].connId!)) : Promise.resolve(null);

  const incoming = members.filter((m) => relationOf(m.id) === 'incoming');
  const connected = members.filter((m) => relationOf(m.id) === 'connected');

  return { members, incoming, connected, relationOf, request, remove, accept, loaded, error };
}
