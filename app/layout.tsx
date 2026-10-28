import type { Metadata } from 'next';
import Script from 'next/script';
import { GoogleAnalytics } from '@/components/google-analytics';
import { MarketingAttributionTracker } from '@/components/marketing-attribution';
import './globals.css';

const siteUrl = 'https://www.leemockups.com';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? siteUrl),
  title: {
    default: 'Video Mockups for Product Listings | LeeMockups',
    template: '%s | LeeMockups',
  },
  description: 'Create video mockups online with LeeMockups. Choose a product, add your design in the browser, and save an MP4 video and still images.',
  keywords: ['video mockup', 'video mockups', 'product video mockup', 'animated mockup', 'mockup generator', 'LeeMockups'],
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  icons: { icon: '/leemockups-symbol.png' },
  openGraph: {
    title: 'Video Mockups for Product Listings | LeeMockups',
    description: 'Turn your artwork into product video mockups online with LeeMockups.',
    images: [{ url: '/og.png', width: 1536, height: 864, alt: 'LeeMockups video mockup generator' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Video Mockups for Product Listings | LeeMockups',
    description: 'Turn your artwork into product video mockups online with LeeMockups.',
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
      <body>{children}<MarketingAttributionTracker /><GoogleAnalytics /><Script src="https://trtc.io/knocket-sdk/sdk.js?identifier=b9b0861f7897ffb683&v=1792859357282" strategy="lazyOnload" /></body>
    </html>
  );
}
