import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AU Youth Network',
  description: 'A digital home for African Union interns, volunteers and fellows.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning style={{ fontFamily: "'Chopin', system-ui, -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
