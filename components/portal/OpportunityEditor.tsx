'use client';

import { useState } from 'react';
import { Modal } from '@/components/portal/ui';
import { NEWS_IMAGES, OPP_KINDS, fromLocalInput, toLocalInput, type OppKind, type Opportunity } from '@/lib/news';
import { saveOpportunity, uploadNewsImage } from '@/lib/portal';
import s from '@/styles/Portal.module.css';

/** Admins: post a new opportunity, or edit `item`. Calls onSaved with its slug. */
export function OpportunityEditor({ item, onClose, onSaved }: { item?: Opportunity; onClose: () => void; onSaved: (slug: string) => void }) {
  const [f, setF] = useState({
    title: item?.title ?? '', kind: (item?.kind ?? 'Internship') as OppKind, source: item?.source ?? 'AU Commission',
    img: item?.img ?? NEWS_IMAGES[0].src, excerpt: item?.excerpt ?? '', body: (item?.body ?? []).join('\n\n'),
    applyUrl: item?.applyUrl ?? '', eventAt: toLocalInput(item?.eventAt),
  });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  return (
    <Modal title={item ? 'Edit opportunity' : 'New opportunity'} onClose={onClose}>
      <form className={s.form} onSubmit={async (e) => {
        e.preventDefault();
        const url = f.applyUrl.trim();
        if (url && !/^https?:\/\//i.test(url)) { setErr('The apply link must start with http:// or https://'); return; }
        setBusy(true); setErr(null);
        const res = await saveOpportunity({
          title: f.title.trim(), kind: f.kind, source: f.source.trim() || 'AU Commission', img: f.img,
          excerpt: f.excerpt.trim(), body: f.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
          applyUrl: url || null, eventAt: fromLocalInput(f.eventAt),
        }, item?.slug);
        setBusy(false);
        if (res.error) setErr(res.error);
        else onSaved(res.slug!);
      }}>
        <div className={s.field}>
          <label className={s.label} htmlFor="op-title">Title</label>
          <input id="op-title" className={s.input} value={f.title} onChange={set('title')} required maxLength={160} />
        </div>
        <div className={s.formRow}>
          <div className={s.field}>
            <label className={s.label} htmlFor="op-kind">Type</label>
            <select id="op-kind" className={s.input} value={f.kind} onChange={set('kind')}>
              {OPP_KINDS.map((k) => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="op-source">Source</label>
            <input id="op-source" className={s.input} value={f.source} onChange={set('source')} maxLength={60} placeholder="e.g. HRST Department" />
          </div>
        </div>
        <div className={s.formRow}>
          <div className={s.field}>
            <label className={s.label} htmlFor="op-when">Date (event day or deadline)</label>
            <input id="op-when" type="datetime-local" className={s.input} value={f.eventAt} onChange={set('eventAt')} />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="op-url">Apply link (optional)</label>
            <input id="op-url" type="url" className={s.input} value={f.applyUrl} onChange={set('applyUrl')} placeholder="https://…" />
          </div>
        </div>
        <small style={{ fontSize: 12, color: 'var(--p-ink-2)' }}>
          With a link, Apply opens it. Without one, members press Register and you see the list on this page. Members can press Notify me when a date is set.
        </small>
        <div className={s.field}>
          <span className={s.label}>Photo</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.photoPrev} src={f.img} alt="Preview of the opportunity photo" />
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
            <select className={s.input} style={{ flex: 1, minWidth: 150, width: 'auto' }} aria-label="Or pick a stock photo"
              value={NEWS_IMAGES.some((i) => i.src === f.img) ? f.img : 'custom'} onChange={(e) => { if (e.target.value !== 'custom') setF({ ...f, img: e.target.value }); }}>
              {!NEWS_IMAGES.some((i) => i.src === f.img) && <option value="custom">Your uploaded photo</option>}
              {NEWS_IMAGES.map((i) => <option key={i.src} value={i.src}>{i.label}</option>)}
            </select>
          </div>
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="op-excerpt">Summary</label>
          <textarea id="op-excerpt" className={s.textarea} style={{ minHeight: 70 }} value={f.excerpt} onChange={set('excerpt')} maxLength={400}
            placeholder="One or two sentences shown on the cards" />
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="op-body">Details</label>
          <textarea id="op-body" className={s.textarea} style={{ minHeight: 160 }} value={f.body} onChange={set('body')}
            placeholder="Leave a blank line between paragraphs" />
        </div>
        {err && <p className={s.agendaEmpty} role="alert">{err}</p>}
        <div className={s.formActions}>
          <button type="button" className={s.btnLine} onClick={onClose}>Cancel</button>
          <button type="submit" className={s.btnDark} disabled={!f.title.trim() || busy || uploading}>{busy ? 'Saving…' : item ? 'Save changes' : 'Publish'}</button>
        </div>
      </form>
    </Modal>
  );
}
