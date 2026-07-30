'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useStore, UserRole } from '@/lib/store';

/**
 * SessionSync — invisible bridge component.
 * Watches the NextAuth session and pushes the authenticated user
 * into the Zustand store the moment the session becomes available.
 * This is necessary because Google OAuth navigates away and remounts
 * the page, so the AuthModal's local state is gone on return.
 */
export default function SessionSync() {
  const { data: session, status } = useSession();
  const { setCurrentUser, currentUser } = useStore();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Only sync if the store doesn't already have this user
      const sessionEmail = session.user.email || '';
      if (currentUser?.email !== sessionEmail) {
        setCurrentUser({
          id: (session.user as any).id || `usr-${Date.now()}`,
          email: sessionEmail,
          name:
            session.user.name ||
            session.user.email?.split('@')[0] ||
            'Guest',
          role: ((session.user as any).role as UserRole) || 'customer',
          loyaltyPoints: 500,
        });
      }
    }

    if (status === 'unauthenticated') {
      // If NextAuth says logged out, clear the store too
      // (handles server-side sign-out scenarios)
      // Only clear if the current user was a Google user — don't
      // blow away OTP-authenticated sessions which don't use NextAuth.
      // We check for a real UUID-like id vs an OTP-style id.
      if (currentUser && !(currentUser.id || '').startsWith('usr-')) {
        setCurrentUser(null);
      }
    }
  }, [status, session]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
