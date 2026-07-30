import './globals.css';
import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import { StoreProvider } from '@/lib/store';
import AuthProvider from '@/components/AuthProvider';
import SessionSync from '@/components/SessionSync';
import CartToast from '@/components/CartToast';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Haven Restaurant & Lounge — Smart Luxury Gastronomy',
  description: 'Ultra-luxury dining operations platform featuring real-time kitchen sync, 3D card checkout, smart table reservations, and Gemini AI operational insights.',
  keywords: 'luxury restaurant, fine dining, wagyu beef, wine pairing, real-time kitchen sync, SaaS management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable} scroll-smooth`}>
      <body className="bg-haven-bg text-haven-text-primary antialiased selection:bg-haven-gold selection:text-black">
        <AuthProvider>
          <StoreProvider>
            <SessionSync />
            <CartToast />
            {children}
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
