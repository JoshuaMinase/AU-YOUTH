'use client';

import { useRef, useState } from 'react';
import { ConfirmDialog, Hero, I, Modal, useToast } from '@/components/portal/ui';
import { softAvatar } from '@/lib/data';
import { useMe } from '@/lib/me';
import { useIso } from '@/lib/hooks';
import { useDepartmentOptions, useFaqs, useTickets, type Faq } from '@/lib/portal';
import { TicketRow } from '@/components/portal/Tickets';
import { getLenis } from '@/components/SmoothScroll';
import s from '@/styles/Portal.module.css';

type Panel = 'report' | 'handbook' | 'faq';

const CARDS: { id: Panel; title: string; sub: string; bg: string; icon: JSX.Element }[] = [
  { id: 'report', title: 'Report an issue', sub: 'Something broken at work? Send it to the department that can fix it.', bg: '#8F2D56', icon: I.alert },
  { id: 'handbook', title: 'Handbook', sub: 'The guide, policies and code of conduct.', bg: '#117302', icon: I.book },
  { id: 'faq', title: 'FAQs', sub: 'Frequently asked questions from the community.', bg: '#0072C6', icon: I.help },
];

const HANDBOOK = [
  { t: 'Welcome & onboarding', d: 'Your first week, who to meet and how to get your access badge.' },
  { t: 'Working hours & leave', d: 'Standard hours, remote days and how to request leave.' },
  { t: 'Code of conduct', d: 'Professional standards, confidentiality and respectful workplace policy.' },
  { t: 'Stipends & allowances', d: 'Payment schedule, eligible expenses and how to submit claims.' },
  { t: 'End of placement', d: 'Reports, certificates and staying in the alumni network.' },
];

/** add or edit one FAQ (admins) */
function FaqForm({ faq, onSave, onClose }: { faq?: Faq; onSave: (q: string, a: string) => Promise<string | null>; onClose: () => void }) {
  const [q, setQ] = useState(faq?.question ?? '');
  const [a, setA] = useState(faq?.answer ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <Modal title={faq ? 'Edit question' : 'Add a question'} onClose={onClose}>
      <form className={s.form} onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true); setErr(null);
        const msg = await onSave(q.trim(), a.trim());
        if (msg) { setErr(msg); setBusy(false); }
      }}>
        <div className={s.field}>
          <label className={s.label} htmlFor="faq-q">Question</label>
          <input id="faq-q" className={s.input} value={q} onChange={(e) => setQ(e.target.value)} required maxLength={200} placeholder="e.g. How do I get my access badge?" />
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="faq-a">Answer</label>
          <textarea id="faq-a" className={s.textarea} style={{ minHeight: 140 }} value={a} onChange={(e) => setA(e.target.value)} required maxLength={1500} placeholder="Keep it short and practical" />
        </div>
        {err && <p className={s.agendaEmpty} role="alert">{err}</p>}
        <div className={s.formActions}>
          <button type="button" className={s.btnLine} onClick={onClose}>Cancel</button>
          <button type="submit" className={s.btnDark} disabled={!q.trim() || !a.trim() || busy}>{busy ? 'Saving…' : faq ? 'Save changes' : 'Add question'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function GetHelpPage() {
  const { tickets, file } = useTickets();
  const departments = useDepartmentOptions();
  const { me } = useMe();
  const isAdmin = me.access !== 'user';
  const { faqs, loaded: faqsLoaded, error: faqsError, add: addFaq, update: updateFaq, remove: removeFaq } = useFaqs();
  const [toast, toastNode] = useToast();
  const [faqForm, setFaqForm] = useState<Faq | 'new' | null>(null);
  const [faqDelete, setFaqDelete] = useState<Faq | null>(null);
  const role = me.role.trim(); // Intern, Fellow, Volunteer…
  const handbook = `${role || 'AU Youth'} handbook`;
  const mine = tickets.filter((t) => t.mine);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [sent, setSent] = useState<string | null>(null);   // where the ticket was sent, for the thank-you message
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /* bring the opened panel into view */
  useIso(() => {
    if (!panel || !panelRef.current) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(panelRef.current, { offset: -100 });
    else panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [panel]);

  const toggle = (p: Panel) => { setPanel((cur) => (cur === p ? null : p)); setSent(null); setErr(null); };

  /* file a ticket: it goes to the chosen department's group chat, or to the admins when none is chosen (docs/sql/029_ticket_workflow.sql) */
  const report = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const deptId = String(f.get('dept') ?? '');
    setBusy(true); setErr(null);
    const error = await file(String(f.get('title') ?? '').trim(), String(f.get('urgency')), String(f.get('description') ?? '').trim(), deptId || null);
    setBusy(false);
    if (error) setErr(`Could not send your ticket: ${error}`);
    else setSent(departments.find((d) => d.id === deptId)?.name ?? '');
  };

  return (
    <>
      <Hero plain eyebrow="Support" title="Get *Help*" desc="Report a problem to the right department and find AU Youth resources." />

      <div className={s.helpGrid}>
        {CARDS.map((c) => c.id === 'handbook' ? { ...c, title: handbook, sub: `The ${role || 'AU Youth'} guide, policies and code of conduct.` } : c).map((c) => (
          <button key={c.id} type="button" className={s.helpCard} aria-expanded={panel === c.id} aria-controls="help-panel" onClick={() => toggle(c.id)} data-reveal>
            <span className={s.helpIcon} style={softAvatar(c.bg)}>{c.icon}</span>
            <span className={s.helpTitle}>{c.title}</span>
            <span className={s.helpSub}>{c.sub}</span>
            <span className={s.helpArrow} aria-hidden="true">→</span>
          </button>
        ))}
      </div>

      <div id="help-panel" ref={panelRef}>
        {panel === 'report' && (
          <section className={`${s.card} ${s.panel}`}>
            <div className={s.cardHead}><div><p className={s.cardEyebrow}>Support ticket</p><h2 className={s.cardTitle}>Report an issue</h2></div></div>
            {sent !== null ? (
              <div className={s.success} role="status">
                {I.check} {sent
                  ? `Thanks. Your ticket was sent to ${sent}. When someone there takes it, a chat opens with you and you will get a notification.`
                  : 'Thanks. Your ticket is with the admins, who will pick the department that can fix it. You will get a notification.'}
              </div>
            ) : (
              <form className={s.form} onSubmit={report}>
                <div className={s.formRow}>
                  <div className={s.field}>
                    <label className={s.label} htmlFor="r-dept">Who should fix it?</label>
                    <select id="r-dept" name="dept" className={s.input} defaultValue="">
                      <option value="">Let the admins decide</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className={s.field}>
                    <label className={s.label} htmlFor="r-urg">Urgency</label>
                    <select id="r-urg" name="urgency" className={s.input} defaultValue="Normal">
                      {['Low', 'Normal', 'High'].map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div className={s.field}>
                  <label className={s.label} htmlFor="r-title">Subject</label>
                  <input id="r-title" name="title" className={s.input} required minLength={3} maxLength={80} placeholder="e.g. Printer on the 3rd floor is offline" />
                </div>
                <div className={s.field}>
                  <label className={s.label} htmlFor="r-desc">What happened?</label>
                  <textarea id="r-desc" name="description" className={s.textarea} required minLength={10} maxLength={2000} placeholder="Describe the problem and what you have already tried…" />
                </div>
                {err && <p className={s.agendaEmpty} role="alert">{err}</p>}
                <div className={s.formActions}>
                  <button type="button" className={s.btnLine} onClick={() => setPanel(null)}>Cancel</button>
                  <button type="submit" className={s.btnDark} disabled={busy}>{I.send} {busy ? 'Sending…' : 'Send ticket'}</button>
                </div>
              </form>
            )}
            {mine.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <p className={s.agendaLabel}>Your tickets</p>
                <div className={s.list}>{mine.map((tk) => <TicketRow key={tk.id} t={tk} admin={false} />)}</div>
              </div>
            )}
          </section>
        )}

        {panel === 'handbook' && (
          <section className={`${s.card} ${s.panel}`}>
            <div className={s.cardHead}><div><p className={s.cardEyebrow}>Resources</p><h2 className={s.cardTitle}>{handbook}</h2></div></div>
            <div className={s.list}>
              {HANDBOOK.map((h, i) => (
                <div key={h.t} className={s.listRow}>
                  <span className={s.abbr} >{String(i + 1).padStart(2, '0')}</span>
                  <div className={s.rowMain}><p className={s.rowTitle}>{h.t}</p><p className={s.rowSub}>{h.d}</p></div>
                </div>
              ))}
            </div>
          </section>
        )}

        {panel === 'faq' && (
          <section className={`${s.card} ${s.panel}`}>
            <div className={s.cardHead}>
              <div><p className={s.cardEyebrow}>Answers</p><h2 className={s.cardTitle}>Frequently asked questions</h2></div>
              {isAdmin && <button type="button" className={`${s.btnDark} ${s.btnSm}`} onClick={() => setFaqForm('new')}>{I.plus} Add question</button>}
            </div>
            <div className={s.list}>
              {faqs.map((f) => (
                <div key={f.id} className={s.listRow} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <button type="button" onClick={() => setOpenFaq(openFaq === f.id ? null : f.id)} aria-expanded={openFaq === f.id}
                      style={{ flex: 1, display: 'flex', justifyContent: 'space-between', gap: 12, border: 0, background: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', font: 'inherit' }}>
                      <span className={s.rowTitle}>{f.question}</span><span aria-hidden="true" className={s.rowTitle}>{openFaq === f.id ? '−' : '+'}</span>
                    </button>
                    {isAdmin && (
                      <>
                        <button type="button" className={s.iconBtn} aria-label={`Edit ${f.question}`} onClick={() => setFaqForm(f)}>{I.edit}</button>
                        <button type="button" className={s.iconBtn} aria-label={`Delete ${f.question}`} onClick={() => setFaqDelete(f)}>{I.close}</button>
                      </>
                    )}
                  </div>
                  {openFaq === f.id && <p className={s.rowSub} style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{f.answer}</p>}
                </div>
              ))}
            </div>
            {!faqsLoaded && !faqsError && <p className={s.agendaEmpty}>Loading…</p>}
            {faqsError && <p className={s.agendaEmpty} role="alert">Could not load the questions: {faqsError}</p>}
            {faqsLoaded && !faqsError && !faqs.length && (
              <p className={s.agendaEmpty}>{isAdmin ? 'No questions yet. Use “Add question” to write the first one.' : 'No questions yet. Check back soon.'}</p>
            )}
          </section>
        )}
      </div>

      <section className={s.welfare} data-reveal>
        <span className={s.helpIcon} style={{ background: 'rgba(255,255,255,.15)' }}>{I.phone}</span>
        <div className={s.rowMain}>
          <p className={s.rowTitle}>Welfare &amp; Wellbeing</p>
          <p className={s.rowSub}>Confidential support for AU Youth members — available Mon–Fri, 09:00–17:00.</p>
        </div>
      </section>
      {faqForm && (
        <FaqForm faq={faqForm === 'new' ? undefined : faqForm} onClose={() => setFaqForm(null)}
          onSave={async (q, a) => {
            const msg = faqForm === 'new' ? await addFaq(q, a) : await updateFaq(faqForm.id, q, a);
            if (msg) return msg;
            setFaqForm(null); toast(faqForm === 'new' ? 'Question added' : 'Question updated'); return null;
          }} />
      )}
      {faqDelete && (
        <ConfirmDialog title="Delete this question?" message={`"${faqDelete.question}" will be removed for everyone.`} confirmLabel="Delete"
          onCancel={() => setFaqDelete(null)}
          onConfirm={async () => { const msg = await removeFaq(faqDelete.id); setFaqDelete(null); toast(msg ?? 'Question deleted'); }} />
      )}
      {toastNode}
    </>
  );
}
