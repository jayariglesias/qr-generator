import type { Metadata } from 'next';
import { Syne, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';

const syne = Syne({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['700', '800'],
});

const plex = IBM_Plex_Sans({
  variable: '--font-ui',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'qr. generator',
  description:
    'Open-source QR generator with logos, shapes, gradients, and PNG/SVG export.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${plex.variable}`}>{children}</body>
    </html>
  );
}
