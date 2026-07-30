import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyOtpHash, recordAttempt } from '@/lib/otp';
import { redis } from '@/lib/redis';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

const BCRYPT_COST = 12;

const resetSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'Reset code must be 6 digits'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = resetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const { email, otp, newPassword } = parsed.data;
    const lowerEmail = email.toLowerCase().trim();

    // Check attempt lockout (separate namespace from login OTP attempts)
    const attemptKey = `otp:attempts:pwreset:${lowerEmail}`;
    const attemptStatus = await recordAttempt(attemptKey, 5, 900);
    if (!attemptStatus.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many failed attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    // Fetch hashed OTP from the password-reset Redis namespace
    const redisKey = `otp:pwreset:${lowerEmail}`;
    const storedHash = await redis.get(redisKey);

    if (!storedHash) {
      return NextResponse.json(
        { success: false, error: 'Reset code expired or not requested. Please request a new one.' },
        { status: 400 }
      );
    }

    // Constant-time OTP comparison
    const isValid = verifyOtpHash(otp, storedHash as string);
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid or expired reset code. ${attemptStatus.remaining} attempt(s) remaining.`,
        },
        { status: 401 }
      );
    }

    // OTP valid — hash the new password (cost factor 12)
    // newPassword is never logged
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);

    // Update user record in Supabase
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('email', lowerEmail);

    if (dbError) {
      console.error('Database error on password reset:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to update password. Please try again.' },
        { status: 500 }
      );
    }

    // Invalidate the reset OTP so it can't be replayed
    await redis.del(redisKey);
    // Clear attempt counter on success
    await redis.del(attemptKey);

    // Note: NextAuth sessions use JWTs with a secret-signed token — there is no
    // server-side session registry to invalidate without adding a token blocklist.
    // Existing sessions will expire naturally per NEXTAUTH_SECRET rotation.
    // If hard-invalidation is required, add a JWT blocklist using Redis in the future.

    return NextResponse.json({ success: true, message: 'Password updated successfully.' });
  } catch (error: any) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
