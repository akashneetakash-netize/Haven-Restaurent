# Haven Restaurant & Lounge — Authentication Testing Guide

Follow these manual testing steps to verify all authentication and OTP delivery flows in development.

---

## 1. Prerequisites Setup
1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
2. Fill in your real API credentials in `.env.local` for:
   - Google Cloud Console OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
   - SendGrid (`SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`)
   - Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`)
   - Upstash Redis (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)
   - Supabase (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

3. Run the Supabase SQL migration:
   - Copy contents of `supabase/migrations/0001_init_auth.sql` into the Supabase SQL Editor and run query.

---

## 2. Google OAuth Verification
1. Start local development server: `npm run dev`.
2. Open `http://localhost:3000` in your browser.
3. Click **Sign In** -> **Continue with Google**.
4. Authorize Google account.
5. Verify user profile upsert in Supabase `users` table with `auth_provider = 'google'` and `email_verified = true`.

---

## 3. Email OTP Flow Verification (SendGrid)
1. Open Haven website and click **Sign In**.
2. Enter your real email address (e.g. `yourname@gmail.com`) and click **Continue**.
3. Check your email inbox for a styled message from Haven Restaurant & Lounge containing a 6-digit code.
4. Input the code in the OTP screen.
5. Verify success notification and user profile saved in Supabase `users` table.

---

## 4. WhatsApp OTP Flow Verification (Twilio)
1. Join the Twilio WhatsApp Sandbox on your mobile device (Send `join <sandbox-code>` to `+1 415 523 8886`).
2. Open Haven website sign in modal.
3. Enter your WhatsApp phone number with country code (e.g., `+14155552671`).
4. Click **Continue**.
5. Check your WhatsApp messages for the verification code.
6. Enter code in UI to confirm login and verify `phone_verified = true` in Supabase.

---

## 5. Rate Limiting Test
1. Submit OTP request for the same email/phone 4 times in rapid succession.
2. Verify 4th request returns HTTP status `429 Too Many Requests` with message: *"Too many OTP requests. Please wait 10 minutes before trying again."*

---

## 6. Expired OTP Test
1. Request an OTP code.
2. Wait 5 minutes (or artificially change Redis key TTL).
3. Submit code in UI.
4. Verify response returns HTTP status `400 Bad Request` with message: *"OTP expired or not requested."*

---

## 7. Forgot Password Flow Test

### Step-by-step:
1. Open the Haven website, click **Sign In**, then click **Sign In** link at the bottom to switch to login mode.
2. Click **"Forgot password?"** beneath the password field.
3. Enter a registered email address and click **Send Reset Code**.
4. Verify the notification: *"If an account exists, a reset code was sent..."* appears.
5. Check your email inbox for a styled "Password Reset Request" email from Haven with a 6-digit code.
6. Enter the 6-digit code in the OTP boxes.
7. Enter a new password (≥ 8 characters, at least 1 number) and confirm it.
8. Click **Reset Password**.
9. Verify the success animation shows "Password Updated" and mode switches back to login after ~1.5 seconds.
10. Log in with the **new** password/OTP flow to confirm the account works.
11. Attempt logging in with the **old** password to confirm it no longer works.

### Security Validation:
- Enter a non-registered email in step 3 → verify you still get the same generic success message (no enumeration leak).
- Submit 4+ reset requests for the same email within 15 minutes → verify rate limiting kicks in silently.
- Enter a wrong OTP code 5 times → verify lockout message: *"Too many failed attempts."*
- Wait for the 10-minute OTP expiry → verify: *"Reset code expired or not requested."*

