'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CONSENT_OPEN_EVENT, readConsent, saveConsent } from '@/lib/consent';
import s from '@/styles/Legal.module.css';

/** Cookie notice, mounted once in the root layout. Shows until the visitor accepts; "Cookie settings" reopens it. */
export default function CookieBanner() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!readConsent()) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);

  if (!open) return null;

  const accept = () => { saveConsent(); setOpen(false); };
  /* in the portal a tab bar sits at the bottom on phones, so lift the notice above it */
  const inPortal = pathname.startsWith('/dashboard');

  return (
    <section className={`${s.banner} ${inPortal ? s.bannerPortal : ''}`} aria-label="Cookie notice">
      <div className={s.bannerText}>
        <p className={s.bannerTitle}>Cookies on AU Youth Community</p>
        <p>
          We use only the cookies and browser storage needed to keep you signed in and to remember that you have seen this notice. We do not use
          advertising or analytics cookies. Read the <Link href="/cookies">Cookie Policy</Link> and the{' '}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </div>
      <div className={s.bannerActions}>
        <button type="button" className={s.bannerBtn} onClick={accept}>Accept</button>
      </div>
    </section>
  );
}
