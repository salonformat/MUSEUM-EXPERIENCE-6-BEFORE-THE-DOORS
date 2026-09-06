import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Before the Doors Open — Salon Format',
  description: 'Vienna, 15 April 1902. Before the XXIV Secession exhibition opens.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
