import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { type LegalSection } from '../../components/site/LegalPage';
import { LEGAL } from '../../lib/legal';

export const metadata: Metadata = { title: 'Acceptable Use Policy' };

const SECTIONS: LegalSection[] = [
  {
    id: 'spirit', title: 'The idea',
    body: (
      <p>
        The Community is a place for young people serving the African Union to connect, learn and contribute. Treat everyone the way you would
        want to be treated at work. This policy is part of the <Link href="/terms">Terms of Use</Link>.
      </p>
    ),
  },
  {
    id: 'dont', title: 'What you must not do',
    body: (
      <>
        <ul>
          <li><strong>Harass or bully</strong> anyone, or send threats, insults or unwanted repeated messages.</li>
          <li><strong>Discriminate or spread hate</strong> against people because of race, ethnicity, nationality, gender, religion, disability, age, sexual orientation or any similar reason.</li>
          <li><strong>Share sexual content</strong>, graphic violence, or anything that sexualises or endangers a child.</li>
          <li><strong>Promote or plan illegal activity</strong>, violence, or self-harm instructions.</li>
          <li><strong>Pretend to be someone else</strong>, including an administrator, an officer or the African Union, or give false information about yourself.</li>
          <li><strong>Share private information</strong> about other people (addresses, ID numbers, private photos) without their permission.</li>
          <li><strong>Post spam</strong>, scams, advertising, chain messages, or links to harmful websites.</li>
          <li><strong>Upload malicious files</strong>, or try to break, overload, scan or get around the security of the Community, or access accounts or data that are not yours.</li>
          <li><strong>Share content you do not have the right to share</strong>, such as copyrighted material or confidential documents.</li>
          <li><strong>Speak for the African Union</strong> or present your personal views as official positions.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'checks', title: 'How we check',
    body: (
      <>
        <p>
          Messages and photos are screened automatically before they are sent. A message that is flagged is not delivered; you are told why, and it is
          recorded for administrators to review. Voice messages and documents are not screened automatically, so they can still be reported and
          reviewed. When you delete a message, a copy is kept for administrators so that abuse cannot be erased. See the{' '}
          <Link href="/privacy">Privacy Policy</Link> for details.
        </p>
        <p>
          Someone saying they feel low is not punished for it. If you are in danger or in crisis, please contact local emergency services or a
          person you trust right away.
        </p>
      </>
    ),
  },
  {
    id: 'report', title: 'Reporting a problem',
    body: (
      <p>
        If you see something that breaks these rules, tell an administrator or open a ticket from <strong>Get Help</strong> in the portal, or write
        to <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>. If you think a message was blocked by mistake, say so in the same way and we will
        look at it.
      </p>
    ),
  },
  {
    id: 'action', title: 'What can happen',
    body: (
      <>
        <p>Depending on how serious it is, we may:</p>
        <ul>
          <li>remove or hide content;</li>
          <li>send a warning;</li>
          <li>limit features or suspend your account;</li>
          <li>close your account; and</li>
          <li>where the law requires or allows, tell the relevant authorities or your sending organisation.</li>
        </ul>
        <p>We will explain our decision where we reasonably can, and you can ask us to look at it again.</p>
      </>
    ),
  },
];

export default function AcceptableUsePage() {
  return (
    <LegalPage
      current="/acceptable-use"
      eyebrow="Legal"
      title="Acceptable Use Policy"
      intro={<p>Simple rules to keep the Community respectful, safe and useful for everyone.</p>}
      sections={SECTIONS}
    />
  );
}
