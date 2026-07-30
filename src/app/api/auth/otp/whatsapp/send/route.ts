import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateOtp, hashOtp, checkRateLimit } from '@/lib/otp';
import { redis } from '@/lib/redis';
import { sendWhatsAppOtp } from '@/lib/whatsapp';

export const runtime = 'nodejs';

const sendWhatsAppSchema = z.object({
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = sendWhatsAppSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid phone number' },
        { status: 400 }
      );
    }

    let { phone } = parsed.data;
    phone = phone.trim();
    if (!phone.startsWith('+')) {
      phone = `+${phone}`;
    }

    // Rate limiting: Max 3 sends per phone per 10 minutes
    const rateLimitKey = `otp:rl:wa:${phone}`;
    const allowed = await checkRateLimit(rateLimitKey, 3, 600);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP requests for this phone number. Please wait 10 minutes.' },
        { status: 429 }
      );
    }

    // Generate, hash, and store OTP
    const otp = generateOtp();
    const hashed = hashOtp(otp);
    const redisKey = `otp:whatsapp:${phone}`;
    await redis.set(redisKey, hashed, { ex: 300 });

    // Send WhatsApp via Twilio
    await sendWhatsAppOtp(phone, otp);

    return NextResponse.json({ success: true, message: 'WhatsApp verification code sent' });
  } catch (error: any) {
    console.error('WhatsApp OTP send error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send WhatsApp verification code' },
      { status: 500 }
    );
  }
}
