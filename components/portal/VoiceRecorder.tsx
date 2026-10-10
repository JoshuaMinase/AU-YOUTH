'use client';
import { useEffect, useRef, useState } from 'react';
import { I } from './ui';
import { CHAT_MAX_SECONDS, fmtDuration } from '@/lib/chatFiles';
import s from '@/styles/Portal.module.css';

/** formats the browser can record, best first (Chrome/Android use WebM, Safari/iPhone use MP4) */
const MIMES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

/** Records a voice message. Starts as soon as it is shown: Cancel throws it away, Send hands the recording to the page. */
export default function VoiceRecorder({ onDone, onCancel, onError }: {
  onDone: (blob: Blob, seconds: number) => void; onCancel: () => void; onError: (msg: string) => void;
}) {
  const [secs, setSecs] = useState(0);
  const [ready, setReady] = useState(false);
  const rec = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const started = useRef(0);
  const keep = useRef(false);   // true when Send was pressed, false when cancelled
  const done = useRef(onDone);
  const fail = useRef(onError);
  done.current = onDone; fail.current = onError;

  useEffect(() => {
    let live = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    const stop = () => { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; };

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        fail.current('Voice messages are not supported in this browser.'); return;
      }
      let st: MediaStream;
      try { st = await navigator.mediaDevices.getUserMedia({ audio: true }); }
      catch { if (live) fail.current('Microphone access is blocked. Allow the microphone in your browser settings and try again.'); return; }
      if (!live) { st.getTracks().forEach((t) => t.stop()); return; }
      stream.current = st;
      const mime = MIMES.find((m) => MediaRecorder.isTypeSupported(m));
      let r: MediaRecorder;
      try { r = new MediaRecorder(st, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined); }
      catch { stop(); fail.current('Voice messages are not supported in this browser.'); return; }
      rec.current = r;
      r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      r.onstop = () => {
        stop();
        if (!keep.current) return;
        const seconds = Math.round((Date.now() - started.current) / 1000);
        if (seconds < 1 || !chunks.current.length) { fail.current('That voice message was too short. Hold on a little longer.'); return; }
        done.current(new Blob(chunks.current, { type: r.mimeType || mime || 'audio/webm' }), Math.min(seconds, CHAT_MAX_SECONDS));
      };
      r.start(1000);
      started.current = Date.now();
      setReady(true);
      timer = setInterval(() => {
        const n = Math.round((Date.now() - started.current) / 1000);
        setSecs(n);
        if (n >= CHAT_MAX_SECONDS && r.state === 'recording') { keep.current = true; r.stop(); }   // longest allowed: send it
      }, 250);
    })();

    return () => {
      live = false;
      clearInterval(timer);
      keep.current = false;
      if (rec.current && rec.current.state !== 'inactive') rec.current.stop(); else stop();
    };
  }, []);

  const send = () => { const r = rec.current; if (r && r.state === 'recording') { keep.current = true; r.stop(); } };

  return (
    <div className={s.recBar}>
      <button type="button" className={s.chatTool} onClick={onCancel} aria-label="Cancel voice message">{I.trash}</button>
      <span className={s.recDot} aria-hidden="true" />
      <span className={s.recLabel} role="status">{ready ? 'Recording' : 'Waiting for the microphone…'}</span>
      <span className={s.recTime} aria-hidden="true">{fmtDuration(secs)}</span>
      <button type="button" className={s.btnDark} onClick={send} disabled={!ready}>{I.send} Send</button>
    </div>
  );
}
