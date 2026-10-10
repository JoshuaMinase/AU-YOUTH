'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { profileMissing, type Access, type Profile } from '@/lib/data';
import { createClient } from '@/lib/supabase/client';

export interface Me {
  id: string; email: string; first: string; last: string;
  name: string; initials: string; role: string; dept: string;
  /** from the Supabase `admins` table */
  access: Access;
}

export const EMPTY_PROFILE: Profile = {
  bio: '', nationality: '', basedIn: '', start: '', end: '',
  gender: '', skills: [], languages: [],
};

const EMPTY_ME: Me = { id: '', email: '', first: '', last: '', name: '…', initials: '·', role: '', dept: '', access: 'user' };

interface Ctx {
  me: Me;
  profile: Profile;
  ready: boolean;
  /** false = view-only until the required profile fields are filled in (admins are never locked) */
  complete: boolean;
  /** what is still missing, in plain words */
  missing: string[];
  /** returns an error message, or null on success */
  save: (p: Profile, extra: { role: string; dept: string }) => Promise<string | null>;
}

const MeContext = createContext<Ctx>({ me: EMPTY_ME, profile: EMPTY_PROFILE, ready: false, complete: false, missing: [], save: async () => 'Not ready' });
export const useMe = () => useContext(MeContext);

function buildMe(id: string, email: string, row: Record<string, any> | null, access: Access): Me {
  const first = (row?.first_name ?? '').trim();
  const last = (row?.last_name ?? '').trim();
  const fallback = email.split('@')[0] || 'Member';
  const name = first ? `${first}${last ? ` ${last[0].toUpperCase()}.` : ''}` : fallback;
  const initials = ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || (fallback[0] ?? '·').toUpperCase();
  return { id, email, first: first || fallback, last, name, initials, role: row?.role ?? '', dept: row?.dept ?? '', access };
}

function buildProfile(row: Record<string, any> | null): Profile {
  if (!row) return EMPTY_PROFILE;
  return {
    bio: row.bio ?? '', nationality: row.nationality ?? '', basedIn: row.based_in ?? '',
    start: row.start_date ?? '', end: row.end_date ?? '',
    gender: row.gender ?? '',
    skills: row.skills ?? [], languages: row.languages ?? [],
  };
}

export function MeProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me>(EMPTY_ME);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (alive) setReady(true); return; }
      const [{ data: row }, { data: admin }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('admins').select('role').eq('user_id', user.id).maybeSingle(),
      ]);
      if (!alive) return;
      setMe(buildMe(user.id, user.email ?? '', row, (admin?.role as Access | undefined) ?? 'user'));
      setProfile(buildProfile(row));
      setReady(true);
    })();
    return () => { alive = false; };
  }, []);

  const save = useCallback<Ctx['save']>(async (p, extra) => {
    if (!me.id) return 'You are not signed in.';
    const { error } = await createClient().from('profiles').upsert({
      id: me.id,
      first_name: me.first, last_name: me.last,
      role: extra.role.trim(), dept: extra.dept.trim(),
      bio: p.bio, nationality: p.nationality, based_in: p.basedIn,
      start_date: p.start, end_date: p.end,
      gender: p.gender, skills: p.skills, languages: p.languages,
    });
    if (error) return error.message;
    setProfile(p);
    setMe((m) => ({ ...m, role: extra.role.trim(), dept: extra.dept.trim() }));
    return null;
  }, [me.id, me.first, me.last]);

  const missing = useMemo(() => profileMissing(profile, me), [profile, me]);
  const complete = me.access !== 'user' || missing.length === 0;

  const value = useMemo(() => ({ me, profile, ready, complete, missing, save }), [me, profile, ready, complete, missing, save]);
  return <MeContext.Provider value={value}>{children}</MeContext.Provider>;
}
