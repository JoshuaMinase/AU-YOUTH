import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { type LegalSection } from '../../components/site/LegalPage';
import { LEGAL } from '../../lib/legal';

export const metadata: Metadata = { title: 'Terms of Use' };

const SECTIONS: LegalSection[] = [
  {
    id: 'about', title: 'About these Terms',
    body: (
      <>
        <p>
          These Terms of Use (“Terms”) are the rules for using {LEGAL.siteName} (the “Community”) at {LEGAL.siteUrl}, run by {LEGAL.operator}
          (“we”, “us”, “our”). By creating an account or using the Community you agree to these Terms, to the{' '}
          <Link href="/acceptable-use">Acceptable Use Policy</Link>, and you confirm that you have read the <Link href="/privacy">Privacy Policy</Link>.
        </p>
        <p>If you do not agree, please do not create an account or use the Community.</p>
      </>
    ),
  },
  {
    id: 'who', title: 'Who can use the Community',
    body: (
      <>
        <p>The Community is for interns, volunteers, fellows and staff of the African Union who have an approved African Union email address. To use it you must:</p>
        <ul>
          <li>be at least {LEGAL.minAge} years old;</li>
          <li>sign up with your own @africanunion.org or @africa-union.org address;</li>
          <li>give us true and current information, and keep it up to date; and</li>
          <li>have only one account.</li>
        </ul>
        <p>The public pages (home, About, Opportunities, Our Community, Why Join) can be read by anyone.</p>
      </>
    ),
  },
  {
    id: 'account', title: 'Your account',
    body: (
      <>
        <p>
          Keep your password private and do not share your account. You are responsible for what happens under your account. If you think someone
          else has used it, change your password and tell us straight away at <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
        </p>
        <p>Some features (chatting, the calendar, connections, comments) are available only once your profile is complete.</p>
      </>
    ),
  },
  {
    id: 'rules', title: 'How you may use the Community',
    body: (
      <>
        <p>
          Be respectful and use the Community only for its purpose: connecting, learning and contributing together. The{' '}
          <Link href="/acceptable-use">Acceptable Use Policy</Link> lists what is not allowed (for example harassment, hate, threats, sexual content,
          impersonation, spam, illegal content, or trying to break or misuse the service). It is part of these Terms.
        </p>
      </>
    ),
  },
  {
    id: 'content', title: 'Your content',
    body: (
      <>
        <p>
          “Your content” means what you post or send: your profile, messages, photos, files, voice messages, comments, calendar events, tickets and
          anything else you add. You keep ownership of your content.
        </p>
        <p>
          You give us a non-exclusive, worldwide, royalty-free licence to host, store, copy, display and transmit your content, only so that we can
          run the Community and show it to the people you share it with. The licence ends when your content is deleted, except for copies we must
          keep for the reasons in the Privacy Policy (for example safety and moderation records) and backups that are removed in the normal course.
        </p>
        <p>You promise that you own your content or have the right to share it, and that it does not break the law or anyone else’s rights.</p>
        <p>
          Content in chats, comments and your profile can be seen by other members as described in the Privacy Policy. Do not share anything you
          would not want other members to see, such as passwords, ID numbers or bank details.
        </p>
      </>
    ),
  },
  {
    id: 'moderation', title: 'Moderation and removal',
    body: (
      <>
        <p>
          To keep the Community safe, messages and photos are checked automatically before they are sent, and administrators can review reported or
          flagged content, copies of deleted messages and support-ticket chats, as explained in the Privacy Policy. We may block, hide or remove
          content, and warn, suspend or close accounts, when we believe these Terms or the Acceptable Use Policy have been broken, when the law
          requires it, or to protect people. We will tell you why where we reasonably can.
        </p>
      </>
    ),
  },
  {
    id: 'ours', title: 'Our content and brand',
    body: (
      <>
        <p>
          The design, text, logos, graphics and software of the Community belong to us or our licensors and are protected by law. You may view them
          and use them for your personal use of the Community. You may not copy, sell, or reuse them, or use the African Union name, emblem or logos,
          without written permission from their owner.
        </p>
      </>
    ),
  },
  {
    id: 'info', title: 'Opportunities and information',
    body: (
      <>
        <p>
          News, opportunities, events and other information in the Community are shared in good faith for general information. Posting an
          opportunity does not promise that you will be selected, hired or accepted, and listings can change or close without notice. Applications
          and registrations made through a link to another website are between you and that website, and we do not control its content or privacy
          practices. Nothing in the Community is legal, financial, medical or professional advice.
        </p>
      </>
    ),
  },
  {
    id: 'availability', title: 'Availability',
    body: (
      <>
        <p>
          We try to keep the Community running, but we do not promise it will always be available, error-free or secure. We may change, pause or
          end any feature, and we may run maintenance, without notice.
        </p>
      </>
    ),
  },
  {
    id: 'warranty', title: 'No warranties',
    body: (
      <>
        <p>
          To the fullest extent the law allows, the Community is provided “as is” and “as available”, without promises of any kind, whether
          express or implied, including that it is fit for a particular purpose or free of errors. Members are individuals; we do not check or
          guarantee what members say or post.
        </p>
      </>
    ),
  },
  {
    id: 'liability', title: 'Limit of our responsibility',
    body: (
      <>
        <p>
          To the fullest extent the law allows, we are not responsible for indirect or consequential loss, lost opportunities, lost data, or for
          anything another member says or does. Where the law does not allow a limit, for example for fraud, or for death or personal injury caused
          by negligence, we do not limit our responsibility.
        </p>
        <p>Nothing in these Terms takes away rights you have under mandatory laws that protect you.</p>
      </>
    ),
  },
  {
    id: 'yours', title: 'Your responsibility',
    body: (
      <>
        <p>
          If you break these Terms and that leads to a claim or loss for us or for another person, you agree to cooperate with us and, as far as
          the law allows, to be responsible for the reasonable losses your breach caused.
        </p>
      </>
    ),
  },
  {
    id: 'ending', title: 'Ending your use',
    body: (
      <>
        <p>
          You may stop using the Community at any time and may ask us to delete your account (see the Privacy Policy). We may suspend or close your
          account if you break these Terms, if your placement or membership ends, or if the law requires. Sections that by their nature should
          continue (for example intellectual property, limits of responsibility, and disputes) continue after your account ends.
        </p>
      </>
    ),
  },
  {
    id: 'changes', title: 'Changes to these Terms',
    body: (
      <>
        <p>
          We may update these Terms. The “Last updated” date at the top shows when. If a change is important, we will tell you in the Community or
          by email before it starts to apply. If you keep using the Community after a change takes effect, you accept the new Terms. If you do not
          accept them, stop using the Community and ask us to delete your account.
        </p>
      </>
    ),
  },
  {
    id: 'law', title: 'Governing law and disputes',
    body: (
      <>
        <p>
          These Terms are governed by the laws of {LEGAL.governingLaw}, without regard to its conflict-of-law rules. If you have a problem,
          please write to us first at <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a> so we can try to fix it informally. If we
          cannot, the competent courts of {LEGAL.courtsPlace} will decide, unless a mandatory law gives you the right to go to another court.
        </p>
      </>
    ),
  },
  {
    id: 'general', title: 'General',
    body: (
      <>
        <p>
          These Terms, the Privacy Policy, the Cookie Policy and the Acceptable Use Policy are the whole agreement between you and us about the
          Community. If part of these Terms cannot be enforced, the rest still applies. If we do not enforce a right straight away, we have not given
          it up. You may not transfer your account or your rights to anyone else. These Terms are written in English.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      current="/terms"
      eyebrow="Legal"
      title="Terms of Use"
      intro={<p>These are the rules for using the AU Youth Community. They are written in plain language. Please read them before you create an account.</p>}
      sections={SECTIONS}
    />
  );
}
