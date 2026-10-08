'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { I, useToast } from '@/components/portal/ui';
import { NewsEditor } from '@/components/portal/NewsEditor';
import type { NewsItem } from '@/lib/data';
import { useMe } from '@/lib/me';
import { deleteNews } from '@/lib/portal';
import s from '@/styles/Portal.module.css';

/** Edit / delete buttons under an article, for admins only. */
export function ArticleAdmin({ item }: { item: NewsItem }) {
  const { me } = useMe();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, toastNode] = useToast();
  if (me.access === 'user') return null;

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
      <button type="button" className={`${s.btnLine} ${s.btnSm}`} onClick={() => setEditing(true)}>{I.edit} Edit article</button>
      <button type="button" className={`${s.btnLine} ${s.btnSm}`} disabled={busy} onClick={async () => {
        if (!window.confirm('Delete this article for everyone?')) return;
        setBusy(true);
        const err = await deleteNews(item.slug);
        setBusy(false);
        if (err) toast(`Something went wrong: ${err}`);
        else router.push('/dashboard/news');
      }}>{I.close} Delete</button>
      {editing && (
        <NewsEditor item={item} onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); toast('Article updated'); router.refresh(); }} />
      )}
      {toastNode}
    </div>
  );
}
