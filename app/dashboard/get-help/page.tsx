'use client';

import { useRef, useState } from 'react';
import { Hero, I } from '@/components/portal/ui';
import { softAvatar } from '@/lib/data';
import { useMe } from '@/lib/me';
import { useIso } from '@/lib/hooks';
import { useTickets, type Ticket, type TicketStatus } from '@/lib/portal';
import { getLenis } from '@/components/SmoothScroll';
import s from '@/styles/Portal.module.css';

type Panel = 'contact' | 'report' | 'handbook' | 'faq';

const STATUS_LABEL: Record<TicketStatus, string> = { open: 'Open', in_progress: 'In progress', closed: 'Closed' };
const STATUS_TAG: Record<TicketStatus, string> = { open: s.tGold, in_progress: s.tBlue, closed: s.tMuted };

/** one ticket row; admins get a status picker, members see the status */
function TicketRow({ t, admin, onStatus }: { t: Ticket; admin: boolean; onStatus: (st: TicketStatus) => void }) {
  return (
    <div className={s.listRow} style={{ alignItems: 'flex-start' }}>
      <div className={s.rowMain}>
        <p className={s.rowTitle}>{t.area} · {t.urgency} urgency</p>
        <p className={s.rowSub} style={{ whiteSpace: 'pre-wrap' }}>{t.description}</p>
        <p className={s.rowSub}>{admin ? `${t.who} · ` : ''}{t.time}</p>
      </div>
      {admin ? (
        <select className={s.select} value={t.status} aria-label={`Status of ${t.area} report`} onChange={(e) => onStatus(e.target.value as TicketStatus)}>
          {(Object.keys(STATUS_LABEL) as TicketStatus[]).map((st) => <option key={st} value={st}>{STATUS_LABEL[st]}</option>)}
        </select>
      ) : <span className={`${s.tag} ${STATUS_TAG[t.status]}`}>{STATUS_LABEL[t.status]}</span>}
    </div>
  );
}

const CARDS: { id: Panel; title: string; sub: string; bg: string; icon: JSX.Element }[] = [
  { id: 'contact', title: 'Contact a department', sub: 'Email an AU department or office directly.', bg: '#C9AB5C', icon: I.mail },
  { id: 'report', title: 'Report an issue', sub: 'Tell us about a technical problem or platform concern.', bg: '#8F2D56', icon: I.alert },
  { id: 'handbook', title: 'Intern handbook', sub: 'The AU intern guide, policies and code of conduct.', bg: '#117302', icon: I.book },
  { id: 'faq', title: 'FAQs', sub: 'Frequently asked questions from the community.', bg: '#0072C6', icon: I.help },
];

const DEPTS = [
  { name: 'Human Resources, Science & Technology', abbr: 'HRST', email: 'hrst@au.int' },
  { name: 'Political Affairs, Peace & Security', abbr: 'PAPS', email: 'paps@au.int' },
  { name: 'Economic Development, Trade & Industry', abbr: 'ETTIM', email: 'ettim@au.int' },
  { name: 'Health, Humanitarian Affairs & Social Development', abbr: 'HHS', email: 'hhs@au.int' },
  { name: 'Infrastructure & Energy', abbr: 'I&E', email: 'ie@au.int' },
];

const HANDBOOK = [
  { t: 'Welcome & onboarding', d: 'Your first week, who to meet and how to get your access badge.' },
  { t: 'Working hours & leave', d: 'Standard hours, remote days and how to request leave.' },
  { t: 'Code of conduct', d: 'Professional standards, confidentiality and respectful workplace policy.' },
  { t: 'Stipends & allowances', d: 'Payment schedule, eligible expenses and how to submit claims.' },
  { t: 'End of placement', d: 'Reports, certificates and staying in the alumni network.' },
];

const FAQ = [
  { q: 'How do I get my access badge?', a: 'Bring your offer letter and passport to the Security Office on your first day, 08:30–10:00.' },
  { q: 'Who is my cohort lead?', a: 'Your cohort lead is listed on your profile under Department. You can also message the AU Intern Community chat.' },
  { q: 'Can I change departments?', a: 'Requests are reviewed case by case. Speak to your supervisor first, then email HRST.' },
  { q: 'How do I get a placement certificate?', a: 'Certificates are issued after your final report is approved — usually within two weeks of your end date.' },
];

export default function GetHelpPage() {
  const { me } = useMe();
  const { tickets, loaded: ticketsLoaded, error: ticketsError, file, setStatus } = useTickets();
  const isAdmin = me.access !== 'user';
  const [ticketFilter, setTicketFilter] = useState<'active' | 'all'>('active');
  const [statusErr, setStatusErr] = useState<string | null>(null);
  const mine = tickets.filter((t) => t.mine);
  const queue = tickets.filter((t) => ticketFilter === 'all' || t.status !== 'closed');
  const [panel, setPanel] = useState<Panel | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  /* bring the opened panel into view */
  useIso(() => {
    if (!panel || !panelRef.current) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(panelRef.current, { offset: -100 });
    else panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [panel]);

  const toggle = (p: Panel) => { setPanel((cur) => (cur === p ? null : p)); setSent(false); setErr(null); };

  /* file a support ticket (Supabase `support_tickets`, own rows only) */
  const report = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setErr(null);
    const error = await file(String(f.get('area')), String(f.get('urgency')), String(f.get('description') ?? '').trim());
    setBusy(false);
    if (error) setErr(`Could not send your report: ${error}`);
    else setSent(true);
  };

  return (
    <>
      <Hero plain eyebrow="Support" title="Get *Help*" desc="Find support, contact departments and access intern resources." />

      <div className={s.helpGrid}>
        {CARDS.map((c) => (
          <button key={c.id} type="button" className={s.helpCard} aria-expanded={panel === c.id} aria-controls="help-panel" onClick={() => toggle(c.id)} data-reveal>
            <span className={s.helpIcon} style={softAvatar(c.bg)}>{c.icon}</span>
            <span className={s.helpTitle}>{c.title}</span>
            <span className={s.helpSub}>{c.sub}</span>
            <span className={s.helpArrow} aria-hidden="true">→</span>
          </button>
        ))}
      </div>

      <div id="help-panel" ref={panelRef}>
        {panel === 'contact' && (
          <section className={`${s.card} ${s.panel}`}>
            <div className={s.cardHead}><div><p className={s.cardEyebrow}>Directory</p><h2 className={s.cardTitle}>Department contacts</h2></div></div>
            <div className={s.list}>
              {DEPTS.map((d) => (
                <div key={d.abbr} className={s.listRow}>
                  <span className={s.abbr}>{d.abbr}</span>
                  <div className={s.rowMain}><p className={s.rowTitle}>{d.name}</p><p className={s.rowSub}>{d.email}</p></div>
                  <a href={`mailto:${d.email}?subject=${encodeURIComponent(`AU Youth Network — question from ${me.name}`)}`} className={`${s.btnDark} ${s.btnSm}`}>{I.mail} Email</a>
                </div>
              ))}
            </div>
          </section>
        )}

        {panel === 'report' && (
          <section className={`${s.card} ${s.panel}`}>
            <div className={s.cardHead}><div><p className={s.cardEyebrow}>Support ticket</p><h2 className={s.cardTitle}>Report an issue</h2></div></div>
            {sent ? (
              <div className={s.success} role="status">{I.check} Thanks — your report was received. The platform team will reply within two working days.</div>
            ) : (
              <form className={s.form} onSubmit={report}>
                <div className={s.formRow}>
                  <div className={s.field}>
                    <label className={s.label} htmlFor="r-area">Area</label>
                    <select id="r-area" name="area" className={s.input} defaultValue="Dashboard">
                      {['Dashboard', 'Chats', 'Calendar', 'People', 'News', 'Account & login', 'Other'].map((o) => <option key={o}>{o}</option>)}
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
                  <label className={s.label} htmlFor="r-desc">What happened?</label>
                  <textarea id="r-desc" name="description" className={s.textarea} required minLength={10} maxLength={2000} placeholder="Describe the problem and the steps to reproduce it…" />
                </div>
                {err && <p className={s.agendaEmpty} role="alert">{err}</p>}
                <div className={s.formActions}>
                  <button type="button" className={s.btnLine} onClick={() => setPanel(null)}>Cancel</button>
                  <button type="submit" className={s.btnDark} disabled={busy}>{I.send} {busy ? 'Sending…' : 'Send report'}</button>
                </div>
              </form>
            )}
            {mine.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <p className={s.agendaLabel}>Your reports</p>
                <div className={s.list}>{mine.map((tk) => <TicketRow key={tk.id} t={tk} admin={false} onStatus={() => {}} />)}</div>
              </div>
            )}
          </section>
        )}

        {panel === 'handbook' && (
          <section className={`${s.card} ${s.panel}`}>
            <div className={s.cardHead}><div><p className={s.cardEyebrow}>Resources</p><h2 className={s.cardTitle}>Intern handbook</h2></div></div>
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
            <div className={s.cardHead}><div><p className={s.cardEyebrow}>Answers</p><h2 className={s.cardTitle}>Frequently asked questions</h2></div></div>
            <div className={s.list}>
              {FAQ.map((f, i) => (
                <div key={f.q} className={s.listRow} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                  <button type="button" onClick={() => setOpenFaq(openFaq === i ? -1 : i)} aria-expanded={openFaq === i}
                    style={{ display: 'flex', justifyContent: 'space-between', gap: 12, border: 0, background: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', font: 'inherit' }}>
                    <span className={s.rowTitle}>{f.q}</span><span aria-hidden="true" className={s.rowTitle}>{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && <p className={s.rowSub} style={{ fontSize: 14, lineHeight: 1.6 }}>{f.a}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {isAdmin && (
        <section className={`${s.card} ${s.panel}`} data-reveal>
          <div className={s.cardHead}>
            <div><p className={s.cardEyebrow}>Admin</p><h2 className={s.cardTitle}>Support tickets</h2></div>
            <div className={s.pills} role="group" aria-label="Which tickets">
              <button type="button" className={s.pill} aria-pressed={ticketFilter === 'active'} onClick={() => setTicketFilter('active')}>Open</button>
              <button type="button" className={s.pill} aria-pressed={ticketFilter === 'all'} onClick={() => setTicketFilter('all')}>All</button>
            </div>
          </div>
          {statusErr && <p className={s.agendaEmpty} role="alert">{statusErr}</p>}
          <div className={s.list}>
            {queue.map((tk) => (
              <TicketRow key={tk.id} t={tk} admin onStatus={async (st) => setStatusErr((await setStatus(tk.id, st)) && 'Could not change the status. Try again.')} />
            ))}
          </div>
          {ticketsError && <p className={s.agendaEmpty} role="alert">Could not load tickets: {ticketsError}</p>}
          {ticketsLoaded && !ticketsError && !queue.length && <p className={s.agendaEmpty}>{ticketFilter === 'active' ? 'No open tickets.' : 'No tickets yet.'}</p>}
        </section>
      )}

      <section className={s.welfare} data-reveal>
        <span className={s.helpIcon} style={{ background: 'rgba(255,255,255,.15)' }}>{I.phone}</span>
        <div className={s.rowMain}>
          <p className={s.rowTitle}>Welfare &amp; Wellbeing</p>
          <p className={s.rowSub}>Confidential support for interns — available Mon–Fri, 09:00–17:00.</p>
        </div>
        <a href="mailto:welfare@au.int" className={s.btn}>{I.mail} welfare@au.int</a>
      </section>
    </>
  );
}
