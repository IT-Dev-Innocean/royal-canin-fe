import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { Footer } from '@/components/footer/Footer';
import './globals.css';

/** Umami Cloud — override via NEXT_PUBLIC_UMAMI_WEBSITE_ID jika perlu. */
const UMAMI_SCRIPT_SRC =
  process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ??
  'https://cloud.umami.is/script.js';
const UMAMI_WEBSITE_ID =
  process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ??
  '0b30b74b-0bcc-427c-a241-e8ca7f3e93ad';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Royal Canin Vet Symposium 2026',
  description:
    'Exhibition and Symposium for Veterinary Professionals by Royal Canin',
  manifest: '/assets/favicon/site.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Royal Canin Vet Symposium 2026',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      {
        url: '/assets/favicon/favicon-rc.png',
        type: 'image/png',
      },
      {
        url: '/assets/favicon/favicon-rc-32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/assets/favicon/favicon-rc-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/assets/favicon/favicon-rc-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/assets/favicon/favicon-rc-180.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    shortcut: '/assets/favicon/favicon-rc-512.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#e2001a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='id' suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`} suppressHydrationWarning>
        {UMAMI_WEBSITE_ID ? (
          <Script
            src={UMAMI_SCRIPT_SRC}
            strategy='afterInteractive'
            data-website-id={UMAMI_WEBSITE_ID}
          />
        ) : null}
        <div className='flex min-h-screen flex-col'>
          <div className='flex-1'>{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
