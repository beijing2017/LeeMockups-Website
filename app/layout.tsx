import type { Metadata } from 'next';
import { GoogleAnalytics } from '@/components/google-analytics';
import { FeedbackWidget } from '@/components/feedback-widget';
import { MarketingAttributionTracker } from '@/components/marketing-attribution';
import './globals.css';

const siteUrl = 'https://www.leemockups.com';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? siteUrl),
  title: {
    default: 'Video Mockups for Product Listings | LeeMockups',
    template: '%s | LeeMockups',
  },
  description: 'Create video mockups from your artwork with LeeMockups. Choose a product template, add your design, and export an MP4 video and still images on Windows or macOS.',
  keywords: ['video mockup', 'video mockups', 'product video mockup', 'animated mockup', 'mockup generator', 'LeeMockups'],
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  icons: { icon: '/leemockups-symbol.png' },
  openGraph: {
    title: 'Video Mockups for Product Listings | LeeMockups',
    description: 'Turn your artwork into product video mockups with LeeMockups desktop templates.',
    images: [{ url: '/og.png', width: 1536, height: 864, alt: 'LeeMockups desktop mockup software' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Video Mockups for Product Listings | LeeMockups',
    description: 'Turn your artwork into product video mockups with LeeMockups desktop templates.',
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
      <body>{children}<MarketingAttributionTracker /><FeedbackWidget /><GoogleAnalytics /></body>
    </html>
  );
}
