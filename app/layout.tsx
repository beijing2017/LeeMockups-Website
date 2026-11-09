import type { Metadata } from 'next';
import Script from 'next/script';
import { GoogleAnalytics } from '@/components/google-analytics';
import { MarketingAttributionTracker } from '@/components/marketing-attribution';
import { siteUrl } from '@/lib/site-url';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'LeeMockups',
    template: '%s | LeeMockups',
  },
  description: 'Create video mockups online with LeeMockups. Choose a product, add your design in the browser, and save an MP4 video and still images.',
  robots: { index: true, follow: true },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  icons: { icon: '/leemockups-symbol.png' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}<MarketingAttributionTracker /><GoogleAnalytics /><Script src="https://trtc.io/knocket-sdk/sdk.js?identifier=b9b0861f7897ffb683&v=1792859357282" strategy="lazyOnload" /></body>
    </html>
  );
}
