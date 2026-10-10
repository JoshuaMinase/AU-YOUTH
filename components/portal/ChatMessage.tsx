'use client';
import { useEffect, useRef, useState } from 'react';
import { I } from './ui';
import { fmtDuration, fmtSize } from '@/lib/chatFiles';
import type { Msg } from '@/lib/data';
import { getChatFileUrl, peekChatFileUrl } from '@/lib/portal';
import s from '@/styles/Portal.module.css';

/** a photo in a chat bubble; the link to the private file is fetched when the bubble appears */
function ChatImage({ path, alt, onOpen }: { path: string; alt: string; onOpen: (url: string, alt: string) => void }) {
  const [url, setUrl] = useState(() => peekChatFileUrl(path) ?? '');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    getChatFileUrl(path).then((r) => { if (!live) return; if (r.url) setUrl(r.url); else setFailed(true); });
    return () => { live = false; };
  }, [path]);
  if (failed) return <span className={s.msgFile}><span className={s.msgFileInfo}>This photo is not available.</span></span>;
  return (
    <button type="button" className={s.msgImgBtn} onClick={() => url && onOpen(url, alt)} aria-label={`Open photo: ${alt}`} disabled={!url}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url ? <img className={s.msgImg} src={url} alt={alt} loading="lazy" onError={() => setFailed(true)} /> : <span className={s.msgImgWait} aria-hidden="true" />}
    </button>
  );
}

/** a document: tapping it saves the file under its own name */
function ChatFileCard({ path, name, size }: { path: string; name: string; size: number }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const open = async () => {
    setBusy(true); setErr('');
    const r = await getChatFileUrl(path, name);
    setBusy(false);
    if (!r.url) { setErr(r.error ?? 'Could not open the file.'); return; }
    const a = document.createElement('a');
    a.href = r.url; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
  };
  return (
    <button type="button" className={s.msgFile} onClick={open} disabled={busy} aria-label={`Download ${name}, ${fmtSize(size)}`}>
      <span className={s.msgFileIcon}>{I.file}</span>
      <span className={s.msgFileInfo}>
        <b>{name}</b>
        <span>{err || (busy ? 'Opening…' : fmtSize(size))}</span>
      </span>
      <span className={s.msgFileGo}>{I.download}</span>
    </button>
  );
}

let playing: HTMLAudioElement | null = null; // only one voice message plays at a time

/** a voice message; its own small component because the progress bar re-renders several times a second */
function VoicePlayer({ path, seconds }: { path: string; seconds: number }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [on, setOn] = useState(false);
  const [now, setNow] = useState(0);
  const [dur, setDur] = useState(seconds);
  const [err, setErr] = useState('');
  useEffect(() => () => { const a = audio.current; if (a) { a.pause(); if (playing === a) playing = null; } }, []);

  const toggle = async () => {
    const a = audio.current;
    if (!a) return;
    if (on) { a.pause(); return; }
    setErr('');
    if (!a.src) {
      const r = await getChatFileUrl(path);
      if (!r.url) { setErr(r.error ?? 'Could not load the voice message.'); return; }
      a.src = r.url;
    }
    if (playing && playing !== a) playing.pause();
    playing = a;
    try { await a.play(); } catch { setErr('This device cannot play this voice message.'); }
  };

  return (
    <div className={s.voice}>
      <button type="button" className={s.voiceBtn} onClick={toggle} aria-label={on ? 'Pause voice message' : 'Play voice message'}>{on ? I.pause : I.play}</button>
      <input type="range" className={s.voiceBar} min={0} max={dur || 1} step={0.1} value={Math.min(now, dur || 1)} aria-label="Seek in voice message"
        onChange={(e) => { const a = audio.current; if (a && a.src) { a.currentTime = Number(e.target.value); setNow(a.currentTime); } }} />
      <span className={s.voiceTime}>{err ? '!' : fmtDuration(on || now ? now : dur)}</span>
      {err && <span className={s.voiceErr} role="alert">{err}</span>}
      <audio ref={audio} preload="none"
        onPlay={() => setOn(true)} onPause={() => setOn(false)} onEnded={() => { setOn(false); setNow(0); if (playing === audio.current) playing = null; }}
        onTimeUpdate={(e) => setNow(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => { const d = e.currentTarget.duration; if (Number.isFinite(d) && d > 0) setDur(d); }}
        onError={() => { if (audio.current?.src) setErr('This device cannot play this voice message.'); }} />
    </div>
  );
}

/** a message that is still being sent: the same bubble with a spinner instead of the file controls */
function PendingBody({ m }: { m: Msg }) {
  const f = m.file;
  if (!f) return null;
  if (m.kind === 'image') {
    return (
      <span className={s.msgImgPend}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {m.localUrl && <img className={s.msgImg} src={m.localUrl} alt="" aria-hidden="true" />}
        <span className={s.msgSpinBox}><span className={s.spinDisc}><span className={s.spin} /></span></span>
      </span>
    );
  }
  if (m.kind === 'voice') {
    return <div className={s.voice}><span className={s.voiceBtn} aria-hidden="true">{I.mic}</span><span className={s.voiceTime}>Voice message · {fmtDuration(f.seconds ?? 0)}</span></div>;
  }
  return (
    <span className={s.msgFile}>
      <span className={s.msgFileIcon}>{I.file}</span>
      <span className={s.msgFileInfo}><b>{f.name}</b><span>{fmtSize(f.size)}</span></span>
      <span className={s.msgFileGo}><span className={s.spin} aria-hidden="true" /></span>
    </span>
  );
}

/** one chat bubble: text, photo, file or voice message, with a Forward button */
export default function ChatMessage({ m, onForward, onOpenImage }: {
  m: Msg; onForward: (m: Msg) => void; onOpenImage: (url: string, alt: string) => void;
}) {
  const mine = m.from === 'me';
  return (
    <div className={`${s.msgRow} ${mine ? s.msgRowMe : ''}`}>
      <div className={`${s.msg} ${mine ? s.msgMe : s.msgThem}`} data-kind={m.kind && m.kind !== 'text' ? m.kind : undefined} data-pending={m.pending ? '' : undefined}>
        {m.forwarded && <span className={s.msgFwd}>{I.forward} Forwarded</span>}
        {m.who && <b style={{ display: 'block', fontSize: 12 }}>{m.who}</b>}
        {m.pending && m.file && <PendingBody m={m} />}
        {!m.pending && m.file && m.kind === 'image' && <ChatImage path={m.file.path} alt={m.text ? `Photo: ${m.text}` : 'Photo sent in the chat'} onOpen={onOpenImage} />}
        {!m.pending && m.file && m.kind === 'file' && <ChatFileCard path={m.file.path} name={m.file.name} size={m.file.size} />}
        {!m.pending && m.file && m.kind === 'voice' && <VoicePlayer path={m.file.path} seconds={m.file.seconds ?? 0} />}
        {m.text && <span className={s.msgText}>{m.text}</span>}
        {m.pending
          ? <small className={s.msgWait}><span className={s.spin} aria-hidden="true" /> Sending…</small>
          : <small>{m.time}</small>}
      </div>
      {m.id && !m.pending && <button type="button" className={s.msgAct} onClick={() => onForward(m)} aria-label="Forward this message">{I.forward}</button>}
    </div>
  );
}
