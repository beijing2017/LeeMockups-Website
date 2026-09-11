import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://leemockups.com'),
  title: 'LeeMockups — Bring Your Mockups to Life',
  description: 'Download LeeMockups for Windows and macOS. Turn your artwork and Etsy mockup purchase into polished product videos in a few clicks.',
  icons: { icon: '/leemockups-symbol.png' },
  openGraph: {
    title: 'LeeMockups — Bring Your Mockups to Life',
    description: 'Turn your artwork and Etsy mockup purchase into polished product videos in a few clicks.',
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
      <body>{children}</body>
    </html>
  );
}
