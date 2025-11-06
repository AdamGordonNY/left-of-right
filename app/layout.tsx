import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/navigation/header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Content Hub - Discover Videos & Articles',
  description: 'Curated content aggregation platform featuring YouTube videos and Substack articles from top creators',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Header />
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
