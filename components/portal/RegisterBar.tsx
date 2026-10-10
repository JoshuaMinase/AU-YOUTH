'use client';

import { useMe } from '@/lib/me';
import { useRegistration } from '@/lib/portal';
import { useToast } from '@/components/portal/ui';
import s from '@/styles/Portal.module.css';

/** Apply (opens the link) when the opportunity has one; otherwise Register → Registered, with a way to cancel. */
export function RegisterBar({ id, applyUrl }: { id: string; applyUrl: string | null }) {
  const { canWrite } = useMe();
  const { registered, loaded, busy, toggle } = useRegistration(applyUrl ? undefined : id);
  const [toast, toastNode] = useToast();

  if (applyUrl) {
    return (
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }} data-reveal>
        <a href={applyUrl} target="_blank" rel="noopener noreferrer" className={s.btnDark}>Apply now</a>
        <span className={s.cardMeta} style={{ alignSelf: 'center' }}>Opens the application page in a new tab.</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 24 }} data-reveal>
      {registered ? (
        <>
          <span className={`${s.tag} ${s.tGreen}`} role="status">Registered ✓</span>
          <button type="button" className={`${s.btnLine} ${s.btnSm}`} disabled={busy}
            onClick={async () => { const err = await toggle(); toast(err ? `Not saved: ${err}` : 'Registration cancelled'); }}>
            Cancel registration
          </button>
        </>
      ) : (
        <>
          <button type="button" className={s.btnDark} disabled={busy || !loaded || !canWrite}
            onClick={async () => { const err = await toggle(); toast(err ? `Not saved: ${err}` : 'You are registered'); }}>
            {busy ? 'Registering…' : 'Register me'}
          </button>
          {!canWrite && <span className={s.cardMeta}>Finish your profile to register.</span>}
        </>
      )}
      {toastNode}
    </div>
  );
}
