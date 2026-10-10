import type { Metadata, Viewport } from 'next';
import SmoothScroll from '../components/SmoothScroll';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'AU Youth Community — Home', template: '%s — AU Youth Community' },
  description: 'A digital home for the African Union youth community: connect, learn and contribute.',
  icons: { icon: '/assets/logo.svg' },
};

export const viewport: Viewport = {
  themeColor: '#032210',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/assets/fonts/Chopin-Trial-Bold-BF65b1d691a55be.otf" as="font" type="font/otf" crossOrigin="" />
        <link rel="preload" href="/assets/fonts/Chopin-Trial-Regular-BF65b1d6917c0ec.otf" as="font" type="font/otf" crossOrigin="" />
      </head>
      <body suppressHydrationWarning>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
