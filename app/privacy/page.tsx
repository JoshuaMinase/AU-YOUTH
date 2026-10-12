import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { type LegalSection } from '../../components/site/LegalPage';
import { LEGAL } from '../../lib/legal';
import t from '../../styles/Legal.module.css';

export const metadata: Metadata = { title: 'Privacy Policy' };

const SECTIONS: LegalSection[] = [
  {
    id: 'who', title: 'Who we are',
    body: (
      <>
        <p>
          {LEGAL.siteName} ({LEGAL.siteUrl}) is run by {LEGAL.operator}. We decide how and why your personal data is used in the Community, so we are
          the “controller” of it. You can reach us at <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
        </p>
      </>
    ),
  },
  {
    id: 'collect', title: 'What we collect',
    body: (
      <>
        <div className={t.tableWrap}>
          <table className={t.table}>
            <thead><tr><th>Kind</th><th>What it includes</th><th>Where it comes from</th></tr></thead>
            <tbody>
              <tr>
                <td>Account</td>
                <td>First and last name, email address, gender (female, male or prefer not to say), password (stored only in scrambled form; we cannot read it), the date and version of the Terms you accepted</td>
                <td>You, at sign-up</td>
              </tr>
              <tr>
                <td>Profile</td>
                <td>Job title, department, bio, nationality, where you are based, placement start and end dates, skills, languages</td>
                <td>You, in your profile</td>
              </tr>
              <tr>
                <td>Messages and files</td>
                <td>Chat messages, replies, forwards, photos, documents, voice messages, and who they were sent to and when</td>
                <td>You, in chats</td>
              </tr>
              <tr>
                <td>Activity</td>
                <td>Feed posts and comments, connection requests, calendar events, opportunity registrations, “Notify me” reminders, notifications, support tickets and their chats</td>
                <td>You, as you use the portal</td>
              </tr>
              <tr>
                <td>Safety records</td>
                <td>Messages blocked by the automatic check, copies of messages you delete, a log of when an administrator opens a ticket chat</td>
                <td>Created by the Community</td>
              </tr>
              <tr>
                <td>Technical</td>
                <td>IP address, browser and device details, and request logs kept by our hosting and database providers; the sign-in cookie and the browser storage described in the <Link href="/cookies">Cookie Policy</Link></td>
                <td>Your browser</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          We do not use advertising or analytics trackers. You do not have to give us anything optional in your profile, but some features stay locked
          until the required profile fields are filled in.
        </p>
      </>
    ),
  },
  {
    id: 'use', title: 'Why we use it',
    body: (
      <>
        <ul>
          <li><strong>To run your account and the Community</strong> (create your account, sign you in, show your profile, deliver messages, run the calendar, opportunities and tickets). Basis: providing the service you asked for.</li>
          <li><strong>To keep people safe</strong> (check messages and photos, review reports, stop abuse and misuse, protect the service). Basis: our legitimate interest in a safe community, and legal duties.</li>
          <li><strong>To contact you</strong> (confirm your email, reset your password, send “new message” emails and reminders you asked for). Basis: providing the service.</li>
          <li><strong>To meet legal duties</strong> and handle claims. Basis: legal obligation and legitimate interests.</li>
        </ul>
        <p>We do not sell your personal data, and we do not use it for advertising.</p>
      </>
    ),
  },
  {
    id: 'see', title: 'Who can see your data',
    body: (
      <>
        <h3>Other members</h3>
        <p>
          Your profile can be seen by other signed-in members, including your name, role, department, nationality, where you are based, and the rest
          of your profile. Your feed posts, comments and events marked public are visible to members. Messages are visible to the people in that chat.
        </p>
        <h3>Administrators</h3>
        <p>Administrators and the super administrator can also see:</p>
        <ul>
          <li>messages that the automatic check blocked, with the reason;</li>
          <li>a copy of any message you delete, including its attached file, so that abuse cannot be erased;</li>
          <li>support-ticket chats (opened read-only from the Admin panel; each opening is logged);</li>
          <li>reports, registrations for opportunities, and lists in the Admin panel.</li>
        </ul>
        <p>
          Chats are not end-to-end encrypted. Our service providers can technically reach stored data in order to run their service, under contract
          and only for that purpose.
        </p>
        <h3>Other people</h3>
        <p>
          We share data with authorities only when the law requires it or when needed to protect someone’s safety or our rights. We do not otherwise
          give your data to third parties.
        </p>
      </>
    ),
  },
  {
    id: 'ai', title: 'Automatic message check',
    body: (
      <>
        <p>
          Before a text message or a photo is sent, its content is sent to OpenAI’s moderation service to check for harmful content such as
          harassment, hate, threats, sexual content or violence. If something is flagged, the message is not delivered and administrators are told.
          This is an automatic check followed by human review; it does not on its own close an account. Voice messages and documents are not checked
          this way. If the check is unavailable, the message is sent without it.
        </p>
      </>
    ),
  },
  {
    id: 'providers', title: 'Service providers',
    body: (
      <>
        <p>These companies process data for us, only to provide their service:</p>
        <div className={t.tableWrap}>
          <table className={t.table}>
            <thead><tr><th>Provider</th><th>What for</th><th>Data involved</th></tr></thead>
            <tbody>
              <tr><td>Supabase</td><td>Sign-in, database, file storage and live updates</td><td>Everything you put in the Community</td></tr>
              <tr><td>Render</td><td>Hosting the website (Frankfurt, Germany)</td><td>Requests to the site, server logs</td></tr>
              <tr><td>Brevo</td><td>“New message” emails</td><td>Your name and email, the sender’s name and the message text</td></tr>
              <tr><td>OpenAI</td><td>Automatic check of messages and photos</td><td>Text and photos you send in chats</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          Some of these providers handle data outside your country, including outside Africa (for example in Europe and the United States). Where the
          law requires it, we rely on contracts and other safeguards for those transfers.
        </p>
      </>
    ),
  },
  {
    id: 'email', title: 'Emails we send',
    body: (
      <p>
        We send emails to confirm your address and to reset your password. When you get a message in a one-to-one or ticket chat, we send a “new
        message” email with the sender’s name and the text of the message (one email per chat until you open it). Group chats do not send these emails.
      </p>
    ),
  },
  {
    id: 'keep', title: 'How long we keep it',
    body: (
      <>
        <p>We keep your data only as long as we need it for the reasons above:</p>
        <ul>
          <li>Account and profile data: while your account is open, and then until we delete it after you ask or your membership ends.</li>
          <li>Messages and files: until you or an administrator deletes them, or your account is deleted.</li>
          <li>Temporary ticket chats: they disappear from members’ view 24 hours after the ticket is resolved. Administrators can still open them from the archive.</li>
          <li>Safety records (blocked messages, copies of deleted messages, access logs): for as long as needed for safety, investigations and legal claims.</li>
          <li>Backups and logs: for a short period, until they are overwritten in the normal course.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'rights', title: 'Your rights',
    body: (
      <>
        <p>Under the data protection law that applies to you, you may have the right to:</p>
        <ul>
          <li>know what data we hold about you and get a copy;</li>
          <li>correct data that is wrong (you can edit most of it yourself in your Profile);</li>
          <li>ask us to delete your data;</li>
          <li>ask us to limit how we use it, or object to a use that relies on our legitimate interests;</li>
          <li>receive your data in a portable format;</li>
          <li>withdraw a consent you gave, at any time; and</li>
          <li>complain to your data protection authority.</li>
        </ul>
        <p>
          To use these rights, email <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>. We may need to check who you are first, and we
          aim to answer within 30 days. Some data (for example safety records, or content that is part of other people’s conversations) may have to
          be kept or may be exempt, and we will tell you if so.
        </p>
      </>
    ),
  },
  {
    id: 'security', title: 'Security',
    body: (
      <p>
        We protect the Community with encrypted connections (HTTPS), access rules in the database so members can only reach what they are allowed
        to, scrambled passwords, and limited administrator access. No system is perfectly secure. Please use a strong, unique password. If we find a
        breach that puts your data at risk, we will act quickly and tell you and the authorities where the law requires.
      </p>
    ),
  },
  {
    id: 'age', title: 'Age limit',
    body: (
      <p>
        The Community is for people aged {LEGAL.minAge} and over. We do not knowingly collect data from younger people. If you think someone younger has
        signed up, tell us and we will remove the account.
      </p>
    ),
  },
  {
    id: 'cookies', title: 'Cookies and similar storage',
    body: (
      <p>
        We use only the cookies and browser storage needed to sign you in and remember your settings. See the <Link href="/cookies">Cookie Policy</Link>.
      </p>
    ),
  },
  {
    id: 'changes', title: 'Changes to this policy',
    body: (
      <p>
        We may update this policy. The “Last updated” date at the top shows when. If a change matters to you, we will tell you in the Community or
        by email.
      </p>
    ),
  },
  {
    id: 'contact', title: 'Contact and complaints',
    body: (
      <p>
        For any question about your data, email <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>. If you are not happy with our
        answer, you can complain to the data protection authority in your country.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      current="/privacy"
      eyebrow="Legal"
      title="Privacy Policy"
      intro={
        <>
          <p>This policy explains what personal data the AU Youth Community collects, why, who can see it, and the choices you have.</p>
          <p>The short version: we collect what we need to run the Community, we do not sell it or use it for advertising, and you can ask us to correct or delete it.</p>
        </>
      }
      sections={SECTIONS}
    />
  );
}
