'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmDialog, I, useToast } from '@/components/portal/ui';
import { OpportunityEditor } from '@/components/portal/OpportunityEditor';
import { formatWhen, type Opportunity } from '@/lib/news';
import { useMe } from '@/lib/me';
import { deleteOpportunity, useRegistrants } from '@/lib/portal';
import s from '@/styles/Portal.module.css';

/** quotes a CSV cell */
const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;

/** Admins only: the list board of everyone who registered, plus Edit / Delete. */
export function OpportunityAdmin({ item }: { item: Opportunity }) {
  const { me } = useMe();
  const router = useRouter();
  const isAdmin = me.access !== 'user';
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, toastNode] = useToast();
  const { list, loaded, error, reload } = useRegistrants(item.id, isAdmin);
  if (!isAdmin) return null;

  const download = () => {
    const rows = [['Name', 'Role', 'Department', 'Registered at'], ...list.map((r) => [r.name, r.role, r.dept, new Date(r.at).toISOString()])];
    const url = URL.createObjectURL(new Blob([rows.map((r) => r.map(cell).join(',')).join('\n')], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = `registrations-${item.slug}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className={s.card} style={{ marginTop: 20 }} data-reveal>
        <div className={s.cardHead}>
          <div>
            <p className={s.cardEyebrow}>Admins only</p>
            <h2 className={s.cardTitle}>Registered ({loaded ? list.length : '…'})</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className={`${s.btnLine} ${s.btnSm}`} onClick={reload}>Refresh</button>
            {list.length > 0 && <button type="button" className={`${s.btnLine} ${s.btnSm}`} onClick={download}>{I.download} CSV</button>}
          </div>
        </div>
        {item.applyUrl && <p className={s.cardMeta}>This opportunity has an apply link, so members apply there and are not registered here.</p>}
        {error && <p className={s.agendaEmpty} role="alert">Could not load the list: {error}</p>}
        {loaded && !error && !list.length && !item.applyUrl && <p className={s.agendaEmpty}>No one has registered yet.</p>}
        <div data-lenis-prevent style={{ maxHeight: 360, overflowY: 'auto' }}>
          {list.map((r, i) => (
            <div key={r.id} className={s.notif} style={{ cursor: 'default' }}>
              <span className={s.notifIcon} style={{ background: '#ECECE8', color: '#1E2A22' }}>{i + 1}</span>
              <span>
                <span className={s.notifTitle}>{r.name}</span>
                <span className={s.notifText} style={{ display: 'block' }}>{[r.role, r.dept].filter(Boolean).join(' · ') || 'Member'}</span>
                <span className={s.notifTime} style={{ display: 'block' }}>{formatWhen(r.at)}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
        <button type="button" className={`${s.btnLine} ${s.btnSm}`} onClick={() => setEditing(true)}>{I.edit} Edit opportunity</button>
        <button type="button" className={`${s.btnLine} ${s.btnSm}`} onClick={() => setConfirming(true)}>{I.close} Delete</button>
      </div>
      {confirming && (
        <ConfirmDialog title="Delete this opportunity?" message="It will be removed for everyone, together with the list of people who registered. This can't be undone."
          confirmLabel="Delete opportunity" busy={busy} onCancel={() => setConfirming(false)}
          onConfirm={async () => {
            setBusy(true);
            const err = await deleteOpportunity(item.slug, item.img);
            setBusy(false);
            if (err) { setConfirming(false); toast(`Something went wrong: ${err}`); }
            else router.push('/dashboard/opportunities');
          }} />
      )}
      {editing && (
        <OpportunityEditor item={item} onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); toast('Opportunity updated'); router.refresh(); }} />
      )}
      {toastNode}
    </>
  );
}
