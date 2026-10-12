import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { type LegalSection } from '../../components/site/LegalPage';
import CookieSettingsButton from '../../components/CookieSettingsButton';
import { LEGAL } from '../../lib/legal';
import t from '../../styles/Legal.module.css';

export const metadata: Metadata = { title: 'Cookie Policy' };

const SECTIONS: LegalSection[] = [
  {
    id: 'what', title: 'What cookies are',
    body: (
      <p>
        Cookies are small files that a website saves in your browser. Browsers also offer “local storage”, which works in a similar way. In this
        policy, “cookies” covers both.
      </p>
    ),
  },
  {
    id: 'use', title: 'What we use',
    body: (
      <>
        <p>We use only <strong>essential</strong> cookies and storage. They are needed to run the Community.</p>
        <div className={t.tableWrap}>
          <table className={t.table}>
            <thead><tr><th>Name</th><th>Type</th><th>What it does</th><th>How long</th></tr></thead>
            <tbody>
              <tr>
                <td>sb-…-auth-token (may be split into several parts)</td>
                <td>Cookie, first party (Supabase sign-in)</td>
                <td>Keeps you signed in and protects your session</td>
                <td>Until you log out, or up to about 400 days</td>
              </tr>
              <tr>
                <td>sb-…-auth-token-code-verifier</td>
                <td>Cookie, first party (Supabase sign-in)</td>
                <td>Completes sign-up confirmation and password reset safely</td>
                <td>Short, removed when the step ends</td>
              </tr>
              <tr>
                <td>auy-cookie-consent</td>
                <td>Local storage, first party</td>
                <td>Remembers that you have seen this cookie notice</td>
                <td>Until you clear your browser data</td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: 'not', title: 'What we do not use',
    body: (
      <p>
        We do not use advertising cookies, tracking pixels, social-media trackers or analytics cookies, and our fonts and images are served from
        the Community itself rather than from other companies. If we add any optional tool that needs cookies in the future, we will ask for your
        permission first, and it will stay off until you agree.
      </p>
    ),
  },
  {
    id: 'consent', title: 'Your choices',
    body: (
      <>
        <p>
          Because the cookies we use are essential, the notice you see is to inform you. You can open it again at any time:
        </p>
        <p><CookieSettingsButton className={t.linkBtn}>Open cookie notice</CookieSettingsButton></p>
        <p>
          You can also block or delete cookies in your browser settings. If you block essential cookies, you will not be able to sign in. Deleting
          local storage only makes the cookie notice appear again.
        </p>
      </>
    ),
  },
  {
    id: 'more', title: 'More information',
    body: (
      <p>
        See the <Link href="/privacy">Privacy Policy</Link> for how we use personal data, or email <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>
    ),
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      current="/cookies"
      eyebrow="Legal"
      title="Cookie Policy"
      intro={<p>The AU Youth Community uses only the cookies it needs to work. This page lists them.</p>}
      sections={SECTIONS}
    />
  );
}
