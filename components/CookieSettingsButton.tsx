'use client';
import { CONSENT_OPEN_EVENT } from '@/lib/consent';

/** A text button that reopens the cookie notice. `className` comes from the place it sits in. */
export default function CookieSettingsButton({ className, children = 'Cookie settings' }: { className?: string; children?: React.ReactNode }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}>
      {children}
    </button>
  );
}
