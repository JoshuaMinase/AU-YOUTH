'use client';

import { useEffect, useState } from 'react';
import { I, useToast } from '@/components/portal/ui';
import { formatWhen } from '@/lib/news';
import { useReminder } from '@/lib/portal';
import s from '@/styles/Portal.module.css';

/** "Notify me" under a news article or opportunity that has a date: reminders 24 hours and 45 minutes before it. */
export function NotifyMe({ kind, id, eventAt }: { kind: 'news' | 'opportunity'; id?: string; eventAt?: string | null }) {
  const { on, loaded, busy, toggle } = useReminder(kind, id);
  const [toast, toastNode] = useToast();
  /* formatted in the browser only: the server's clock and time zone differ from the reader's */
  const [when, setWhen] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState(false);
  useEffect(() => {
    if (!eventAt) return;
    setWhen(formatWhen(eventAt));
    setUpcoming(new Date(eventAt).getTime() > Date.now());
  }, [eventAt]);

  if (!eventAt || !when) return null;

  return (
    <div className={s.card} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'space-between', padding: '16px 20px', marginTop: 20 }} data-reveal>
      <div>
        <p className={s.cardEyebrow}>{upcoming ? 'Date' : 'This has passed'}</p>
        <p style={{ margin: 0, fontWeight: 700 }}>{when}</p>
        {upcoming && <span className={s.cardMeta}>{on ? 'You will be notified 24 hours and 45 minutes before.' : 'Get a notification 24 hours and 45 minutes before.'}</span>}
      </div>
      {upcoming && (
        <button type="button" className={on ? s.btnLine : s.btnDark} aria-pressed={on} disabled={busy || !loaded}
          onClick={async () => {
            const err = await toggle();
            toast(err ? `Not saved: ${err}` : on ? 'Reminder removed' : 'Done. We will notify you before it starts.');
          }}>
          {I.bell} {on ? 'Notifying you' : 'Notify me'}
        </button>
      )}
      {toastNode}
    </div>
  );
}
