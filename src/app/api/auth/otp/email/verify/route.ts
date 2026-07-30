import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyOtpHash, recordAttempt } from '@/lib/otp';
import { redis } from '@/lib/redis';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = verifyEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const { email, otp } = parsed.data;
    const lowerEmail = email.toLowerCase().trim();

    // Check failed attempt lockout
    const attemptKey = `otp:attempts:email:${lowerEmail}`;
    const attemptStatus = await recordAttempt(attemptKey, 5, 900);
    if (!attemptStatus.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many failed attempts. Account locked for 15 minutes.' },
        { status: 429 }
      );
    }

    // Fetch stored OTP hash from Redis
    const redisKey = `otp:email:${lowerEmail}`;
    const storedHash = await redis.get(redisKey);

    if (!storedHash) {
      return NextResponse.json(
        { success: false, error: 'OTP expired or not requested. Please request a new code.' },
        { status: 400 }
      );
    }

    // Verify OTP hash
    const isValid = verifyOtpHash(otp, storedHash as string);
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid verification code. ${attemptStatus.remaining} attempt(s) remaining.`,
        },
        { status: 401 }
      );
    }

    // OTP Verified! Cleanup Redis
    await redis.del(redisKey);
    await redis.del(attemptKey);

    // Upsert User in Supabase
    const { data: user, error: dbError } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          email: lowerEmail,
          auth_provider: 'email_otp',
          email_verified: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )
      .select('id, email, full_name, role, email_verified, phone_verified')
      .single();

    if (dbError) {
      console.error('Database error updating user on email OTP verify:', dbError);
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: user || { email: lowerEmail, email_verified: true, role: 'customer' },
    });
  } catch (error: any) {
    console.error('Email OTP verify error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
