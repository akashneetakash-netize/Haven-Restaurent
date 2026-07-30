# Haven Restaurant & Lounge — Backend API Specification Contract

This document specifies the complete API contracts for authentication, OTP delivery, rate-limiting, and Google OAuth.

---

## 1. Google OAuth Authentication

- **Endpoint**: `/api/auth/signin/google` (via NextAuth)
- **Method**: `GET` / `POST`
- **Frontend Usage**:
  ```ts
  import { signIn } from 'next-auth/react';
  
  // Trigger Google OAuth Flow
  signIn('google', { callbackUrl: '/' });
  ```
- **Backend Flow**:
  - Redirects to Google consent screen.
  - On callback (`/api/auth/callback/google`), NextAuth creates/upserts the record in Supabase `users` table (`auth_provider = 'google'`, `email_verified = true`).
  - Session cookie is populated with user ID and role (`customer` | `staff` | `admin`).

---

## 2. Email OTP Flow (SendGrid)

### A. Send Email OTP
- **Endpoint**: `/api/auth/otp/email/send`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "email": "customer@example.com"
  }
  ```
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Verification code sent to email"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "success": false, "error": "Invalid email address" }`
  - `429 Too Many Requests`: `{ "success": false, "error": "Too many OTP requests. Please wait 10 minutes before trying again." }`
  - `500 Internal Server Error`: `{ "success": false, "error": "Failed to send verification code" }`

- **Frontend Usage**:
  ```ts
  const res = await fetch('/api/auth/otp/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@example.com' }),
  });
  const data = await res.json();
  ```

---

### B. Verify Email OTP
- **Endpoint**: `/api/auth/otp/email/verify`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "email": "customer@example.com",
    "otp": "123456"
  }
  ```
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Email verified successfully",
    "user": {
      "id": "uuid-v4-identifier",
      "email": "customer@example.com",
      "full_name": "Customer Name",
      "role": "customer",
      "email_verified": true,
      "phone_verified": false
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "success": false, "error": "OTP expired or not requested. Please request a new code." }`
  - `401 Unauthorized`: `{ "success": false, "error": "Invalid verification code. 4 attempt(s) remaining." }`
  - `429 Too Many Requests`: `{ "success": false, "error": "Too many failed attempts. Account locked for 15 minutes." }`

- **Frontend Usage**:
  ```ts
  const res = await fetch('/api/auth/otp/email/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@example.com', otp: '123456' }),
  });
  const data = await res.json();
  ```

---

## 3. WhatsApp OTP Flow (Twilio)

### A. Send WhatsApp OTP
- **Endpoint**: `/api/auth/otp/whatsapp/send`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "phone": "+14155552671"
  }
  ```
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "WhatsApp verification code sent"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "success": false, "error": "Phone number must be at least 8 digits" }`
  - `429 Too Many Requests`: `{ "success": false, "error": "Too many OTP requests for this phone number. Please wait 10 minutes." }`

- **Frontend Usage**:
  ```ts
  const res = await fetch('/api/auth/otp/whatsapp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+14155552671' }),
  });
  const data = await res.json();
  ```

---

### B. Verify WhatsApp OTP
- **Endpoint**: `/api/auth/otp/whatsapp/verify`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "phone": "+14155552671",
    "otp": "123456",
    "email": "optional@example.com"
  }
  ```
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "WhatsApp phone number verified successfully",
    "user": {
      "id": "uuid-v4-identifier",
      "email": "14155552671@whatsapp.haven.local",
      "phone": "+14155552671",
      "role": "customer",
      "phone_verified": true
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "success": false, "error": "OTP expired or not requested. Please request a new code." }`
  - `401 Unauthorized`: `{ "success": false, "error": "Invalid verification code. 3 attempt(s) remaining." }`
  - `429 Too Many Requests`: `{ "success": false, "error": "Too many failed attempts. Locked for 15 minutes." }`

---

## 4. Forgot Password Flow (OTP-based Reset)

### A. Request Password Reset
- **Endpoint**: `/api/auth/password/forgot`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "email": "customer@example.com"
  }
  ```
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "If an account exists with that email, a reset code has been sent."
  }
  ```
  > **Security Note:** This endpoint always returns the same generic response regardless of whether the email exists, to prevent account enumeration.
- **Error Responses**:
  - `400 Bad Request`: `{ "success": false, "error": "Invalid email address" }`
  - Rate limiting is applied (3 requests per 15 minutes per email) but returns generic response to prevent enumeration

- **Frontend Usage**:
  ```ts
  const res = await fetch('/api/auth/password/forgot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@example.com' }),
  });
  const data = await res.json();
  ```

---

### B. Reset Password (Verify OTP + Set New Password)
- **Endpoint**: `/api/auth/password/reset`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "email": "customer@example.com",
    "otp": "123456",
    "newPassword": "MyNewPassword1"
  }
  ```
  > `newPassword` must be ≥ 8 characters and contain at least one number.
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Password updated successfully."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "success": false, "error": "Reset code expired or not requested. Please request a new one." }` or `{ "success": false, "error": "Password must be at least 8 characters" }`
  - `401 Unauthorized`: `{ "success": false, "error": "Invalid or expired reset code. 4 attempt(s) remaining." }`
  - `429 Too Many Requests`: `{ "success": false, "error": "Too many failed attempts. Please try again in 15 minutes." }`
  - `500 Internal Server Error`: `{ "success": false, "error": "Failed to update password. Please try again." }`

- **Frontend Usage**:
  ```ts
  const res = await fetch('/api/auth/password/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'customer@example.com',
      otp: '123456',
      newPassword: 'MyNewPassword1',
    }),
  });
  const data = await res.json();
  ```

