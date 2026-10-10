'use client';

import { useState } from 'react';
import { Modal } from '@/components/portal/ui';
import { NEWS_CATS, type NewsCat, type NewsItem } from '@/lib/data';
import { NEWS_IMAGES, fromLocalInput, toLocalInput } from '@/lib/news';
import { saveNews, uploadNewsImage } from '@/lib/portal';
import s from '@/styles/Portal.module.css';

/** Admins: write a new article, or edit `item`. Calls onSaved with the article's slug. */
export function NewsEditor({ item, onClose, onSaved }: { item?: NewsItem; onClose: () => void; onSaved: (slug: string) => void }) {
  const [f, setF] = useState({
    title: item?.title ?? '', cat: (item?.cat ?? 'Announcements') as NewsCat, source: item?.source ?? 'AU Commission',
    img: item?.img ?? NEWS_IMAGES[0].src, excerpt: item?.excerpt ?? '', body: (item?.body ?? []).join('\n\n'), featured: !!item?.featured,
    eventAt: toLocalInput(item?.eventAt),
  });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  return (
    <Modal title={item ? 'Edit article' : 'New article'} onClose={onClose}>
      <form className={s.form} onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true); setErr(null);
        const res = await saveNews({
          title: f.title.trim(), cat: f.cat, source: f.source.trim() || 'AU Commission', img: f.img,
          excerpt: f.excerpt.trim(), featured: f.featured, eventAt: fromLocalInput(f.eventAt),
          // a blank line starts a new paragraph
          body: f.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
        }, item?.slug);
        setBusy(false);
        if (res.error) setErr(res.error);
        else onSaved(res.slug!);
      }}>
        <div className={s.field}>
          <label className={s.label} htmlFor="nw-title">Title</label>
          <input id="nw-title" className={s.input} value={f.title} onChange={set('title')} required maxLength={160} />
        </div>
        <div className={s.formRow}>
          <div className={s.field}>
            <label className={s.label} htmlFor="nw-cat">Category</label>
            <select id="nw-cat" className={s.input} value={f.cat} onChange={set('cat')}>
              {NEWS_CATS.filter((c) => c !== 'All').map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="nw-source">Source</label>
            <input id="nw-source" className={s.input} value={f.source} onChange={set('source')} maxLength={60} placeholder="e.g. HRST Department" />
          </div>
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="nw-when">Event date (optional)</label>
          <input id="nw-when" type="datetime-local" className={s.input} value={f.eventAt} onChange={set('eventAt')} />
          <small style={{ fontSize: 12, color: 'var(--p-ink-2)' }}>If this is about an event, set when it starts. Readers can press Notify me and get a reminder 24 hours and 45 minutes before.</small>
        </div>
        <div className={s.field}>
          <span className={s.label}>Photo</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.photoPrev} src={f.img} alt="Preview of the article photo" />
          <div className={s.photoRow}>
            <label className={`${s.btnLine} ${s.btnSm}`} style={{ cursor: uploading ? 'wait' : 'pointer' }}>
              {uploading ? 'Uploading…' : 'Upload a photo'}
              <input type="file" accept="image/*" hidden disabled={uploading} onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                setUploading(true); setErr(null);
                const res = await uploadNewsImage(file);
                setUploading(false);
                if (res.error) setErr(res.error);
                else setF((prev) => ({ ...prev, img: res.url! }));
              }} />
            </label>
            <select id="nw-img" className={s.input} style={{ flex: 1, minWidth: 150, width: 'auto' }} aria-label="Or pick a stock photo"
              value={NEWS_IMAGES.some((i) => i.src === f.img) ? f.img : 'custom'} onChange={(e) => { if (e.target.value !== 'custom') setF({ ...f, img: e.target.value }); }}>
              {!NEWS_IMAGES.some((i) => i.src === f.img) && <option value="custom">Your uploaded photo</option>}
              {NEWS_IMAGES.map((i) => <option key={i.src} value={i.src}>{i.label}</option>)}
            </select>
          </div>
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="nw-excerpt">Summary</label>
          <textarea id="nw-excerpt" className={s.textarea} style={{ minHeight: 70 }} value={f.excerpt} onChange={set('excerpt')} maxLength={400}
            placeholder="One or two sentences shown on the news cards" />
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="nw-body">Article</label>
          <textarea id="nw-body" className={s.textarea} style={{ minHeight: 160 }} value={f.body} onChange={set('body')}
            placeholder="Leave a blank line between paragraphs" />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <input type="checkbox" checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} />
          Feature it: top of News and the home &ldquo;Latest announcement&rdquo;
        </label>
        {err && <p className={s.agendaEmpty} role="alert">{err}</p>}
        <div className={s.formActions}>
          <button type="button" className={s.btnLine} onClick={onClose}>Cancel</button>
          <button type="submit" className={s.btnDark} disabled={!f.title.trim() || busy || uploading}>{busy ? 'Saving…' : item ? 'Save changes' : 'Publish'}</button>
        </div>
      </form>
    </Modal>
  );
}
