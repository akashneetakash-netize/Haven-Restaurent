import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyOtpHash, recordAttempt } from '@/lib/otp';
import { redis } from '@/lib/redis';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

const verifyWhatsAppSchema = z.object({
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  email: z.string().email().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = verifyWhatsAppSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid request parameters' },
        { status: 400 }
      );
    }

    let { phone, otp, email } = parsed.data;
    phone = phone.trim();
    if (!phone.startsWith('+')) {
      phone = `+${phone}`;
    }

    // Check failed attempt lockout
    const attemptKey = `otp:attempts:wa:${phone}`;
    const attemptStatus = await recordAttempt(attemptKey, 5, 900);
    if (!attemptStatus.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many failed attempts. Locked for 15 minutes.' },
        { status: 429 }
      );
    }

    // Fetch stored OTP hash from Redis
    const redisKey = `otp:whatsapp:${phone}`;
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

    // Upsert User in Supabase with phone_verified = true
    const userPayload: any = {
      phone,
      auth_provider: 'whatsapp_otp',
      phone_verified: true,
      updated_at: new Date().toISOString(),
    };
    if (email) {
      userPayload.email = email.toLowerCase().trim();
    } else {
      userPayload.email = `${phone.replace(/\+/g, '')}@whatsapp.haven.local`;
    }

    const { data: user, error: dbError } = await supabaseAdmin
      .from('users')
      .upsert(userPayload, { onConflict: email ? 'email' : 'phone' })
      .select('id, email, phone, full_name, role, phone_verified')
      .single();

    if (dbError) {
      console.error('Database error updating user on WhatsApp OTP verify:', dbError);
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp phone number verified successfully',
      user: user || { phone, phone_verified: true, role: 'customer' },
    });
  } catch (error: any) {
    console.error('WhatsApp OTP verify error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify WhatsApp code' },
      { status: 500 }
    );
  }
}
