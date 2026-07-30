import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateOtp, hashOtp, checkRateLimit } from '@/lib/otp';
import { redis } from '@/lib/redis';
import { sendOtpEmail } from '@/lib/email';

export const runtime = 'nodejs';

const sendEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = sendEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid email address' },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const lowerEmail = email.toLowerCase().trim();

    // Rate limiting: Max 3 sends per email per 10 minutes (600s)
    const rateLimitKey = `otp:rl:email:${lowerEmail}`;
    const allowed = await checkRateLimit(rateLimitKey, 3, 600);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP requests. Please wait 10 minutes before trying again.' },
        { status: 429 }
      );
    }

    // Generate, hash, and store OTP
    const otp = generateOtp();
    const hashed = hashOtp(otp);
    const redisKey = `otp:email:${lowerEmail}`;
    await redis.set(redisKey, hashed, { ex: 300 });

    // Send Email via SendGrid
    await sendOtpEmail(lowerEmail, otp);

    return NextResponse.json({ success: true, message: 'Verification code sent to email' });
  } catch (error: any) {
    console.error('Email OTP send error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send verification code' },
      { status: 500 }
    );
  }
}
