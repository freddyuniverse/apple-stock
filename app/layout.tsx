import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'fiindmyduo — Find an iPhone Duo in stock near you',
  description:
    'Pick your iPhone Duo finish and storage, check Apple Store pickup near you, and get pinged the moment one is ready for pickup or 2-hour courier delivery.',
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} bg-background`}>
      <body className="font-sans text-foreground antialiased">{children}</body>
    </html>
  );
}
