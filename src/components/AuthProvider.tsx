'use client';

import { SessionProvider } from 'next-auth/react';

/**
 * AuthProvider — wraps the app in NextAuth's SessionProvider.
 * Must be a Client Component since SessionProvider uses React context.
 * Placed in layout.tsx so useSession() works anywhere in the tree.
 */
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
