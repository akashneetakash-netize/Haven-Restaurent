import crypto from 'crypto';
import { redis } from './redis';

/**
 * Generate a 6-digit numeric OTP using crypto.randomInt
 */
export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Hash an OTP string using SHA-256 before saving to Redis
 */
export function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * Constant-time comparison between input OTP hash and stored hash
 */
export function verifyOtpHash(otp: string, storedHash: string): boolean {
  const inputHash = hashOtp(otp);
  const bufA = Buffer.from(inputHash, 'hex');
  const bufB = Buffer.from(storedHash, 'hex');

  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Rate limit check: Allows max requests within windowSeconds
 */
export async function checkRateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }
  return current <= max;
}

/**
 * Track failed verify attempts: Locks out after maxAttempts for lockoutSeconds
 */
export async function recordAttempt(
  key: string,
  maxAttempts: number = 5,
  lockoutSeconds: number = 900
): Promise<{ allowed: boolean; remaining: number }> {
  const attempts = await redis.incr(key);
  if (attempts === 1) {
    await redis.expire(key, lockoutSeconds);
  }

  const remaining = Math.max(0, maxAttempts - attempts);
  return {
    allowed: attempts <= maxAttempts,
    remaining,
  };
}
