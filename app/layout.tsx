import type { Metadata } from 'next';
import { GoogleAnalytics } from '@/components/google-analytics';
import './globals.css';

const siteUrl = 'https://www.leemockups.com';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? siteUrl),
  title: {
    default: 'LeeMockups — Animated Product Mockup Videos',
    template: '%s | LeeMockups',
  },
  description: 'Download LeeMockups for Windows and macOS. Turn your artwork and mockup templates into polished product videos in a few clicks.',
  keywords: ['animated mockups', 'product listing video', 'product mockup video', 'mockup generator', 'LeeMockups'],
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  icons: { icon: '/leemockups-symbol.png' },
  openGraph: {
    title: 'LeeMockups — Bring Your Mockups to Life',
    description: 'Turn your artwork and mockup templates into polished product videos in a few clicks.',
    images: [{ url: '/og.png', width: 1536, height: 864, alt: 'LeeMockups desktop mockup software' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LeeMockups — Bring Your Mockups to Life',
    description: 'Your design. Beautifully in motion.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}<GoogleAnalytics /></body>
    </html>
  );
}
