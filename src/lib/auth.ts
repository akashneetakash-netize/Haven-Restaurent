import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { supabaseAdmin } from './supabase';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        try {
          // Upsert user in Supabase users table
          const { data, error } = await supabaseAdmin
            .from('users')
            .upsert(
              {
                email: user.email,
                full_name: user.name || '',
                avatar_url: user.image || '',
                auth_provider: 'google',
                email_verified: true,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'email' }
            )
            .select('id, role')
            .single();

          if (error) {
            console.error('Error upserting user in Supabase on Google signIn:', error);
          } else if (data) {
            (user as any).id = data.id;
            (user as any).role = data.role || 'customer';
          }
        } catch (err) {
          console.error('Supabase Google OAuth exception:', err);
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id || user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        token.role = (user as any).role || 'customer';
      } else if (token.email) {
        // Fetch latest role from database if available
        try {
          const { data } = await supabaseAdmin
            .from('users')
            .select('id, role')
            .eq('email', token.email)
            .maybeSingle();

          if (data) {
            token.id = data.id;
            token.role = data.role;
          }
        } catch (e) {
          // Silent fallback
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;
        (session.user as any).role = (token.role as string) || 'customer';
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET || 'haven_restaurant_lounge_secret_key_2026',
};
