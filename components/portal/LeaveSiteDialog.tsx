'use client';
import { Modal } from './ui';
import s from '@/styles/Portal.module.css';

/** Asked before a link in a chat message opens: the address is shown in full so a look-alike address can be spotted. */
export default function LeaveSiteDialog({ url, onClose }: { url: string; onClose: () => void }) {
  let host = url;
  try { host = new URL(url).host; } catch { /* show the whole address */ }
  const go = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };
  return (
    <Modal title="Leave AU Youth Community?" onClose={onClose}>
      <p className={s.confirmText} style={{ marginBottom: 12 }}>
        This link opens another website in a new tab. Only continue if you trust the person who sent it.
      </p>
      <div className={s.leaveUrl}>
        <b>{host}</b>
        <span>{url}</span>
      </div>
      <div className={s.formActions}>
        <button type="button" className={s.btnLine} onClick={onClose}>Cancel</button>
        <button type="button" className={s.btnDark} onClick={go}>Open link</button>
      </div>
    </Modal>
  );
}
