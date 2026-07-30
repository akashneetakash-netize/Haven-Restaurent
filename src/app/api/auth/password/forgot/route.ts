import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateOtp, hashOtp, checkRateLimit } from '@/lib/otp';
import { redis } from '@/lib/redis';
import { supabaseAdmin } from '@/lib/supabase';
import { sendPasswordResetEmail } from '@/lib/email';

export const runtime = 'nodejs';

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = forgotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid email address' },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const lowerEmail = email.toLowerCase().trim();

    // ── Generic response regardless of whether user exists (anti-enumeration) ──
    const genericResponse = NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a reset code has been sent.',
    });

    // Look up user — do NOT reveal existence either way
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', lowerEmail)
      .maybeSingle();

    if (!user) {
      // Simulate a small delay so timing doesn't reveal non-existence
      await new Promise((r) => setTimeout(r, 150));
      return genericResponse;
    }

    // Rate limit: max 3 reset requests per 15 minutes per email (separate namespace from login OTP)
    const rateLimitKey = `otp:rl:pwreset:${lowerEmail}`;
    const allowed = await checkRateLimit(rateLimitKey, 3, 900);
    if (!allowed) {
      // Still return generic to avoid enumeration via rate-limit differences
      return genericResponse;
    }

    // Generate, hash, store OTP (10 min TTL — longer than login OTP)
    const otp = generateOtp();
    const hashed = hashOtp(otp);
    const redisKey = `otp:pwreset:${lowerEmail}`;
    await redis.set(redisKey, hashed, { ex: 600 });

    // Record audit timestamp on user row
    await supabaseAdmin
      .from('users')
      .update({ password_reset_requested_at: new Date().toISOString() })
      .eq('id', user.id);

    // Send the reset email (OTP value is never logged by sendPasswordResetEmail)
    await sendPasswordResetEmail(lowerEmail, otp);

    return genericResponse;
  } catch (error: any) {
    console.error('Password reset request error:', error);
    // Even on server error, return generic to avoid info leakage
    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a reset code has been sent.',
    });
  }
}
