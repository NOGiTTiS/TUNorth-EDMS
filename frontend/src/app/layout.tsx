import type { Metadata } from 'next';
import { Prompt } from 'next/font/google'; // ใช้ Google Font Prompt
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const prompt = Prompt({ 
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-prompt',
});

export const metadata: Metadata = {
  title: 'TUNorth EDMS',
  description: 'Electronic Document Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={`${prompt.className} antialiased`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}