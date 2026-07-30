import sgMail from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export function buildOtpEmailHtml(otp: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0d0f12; color: #f3f4f6; margin: 0; padding: 40px 20px; }
          .container { max-width: 500px; margin: 0 auto; background-color: #161920; border: 1px solid #2a2e39; border-radius: 12px; padding: 32px; text-align: center; }
          .logo { font-size: 24px; font-weight: 700; color: #d97706; letter-spacing: 1px; margin-bottom: 8px; }
          .title { font-size: 18px; font-weight: 600; color: #ffffff; margin-bottom: 24px; }
          .otp-box { background-color: #222632; border: 1px dashed #d97706; border-radius: 8px; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #f59e0b; padding: 16px; margin: 24px 0; }
          .text { font-size: 14px; color: #9ca3af; line-height: 1.5; margin-bottom: 24px; }
          .footer { font-size: 12px; color: #6b7280; border-top: 1px solid #2a2e39; pt: 16px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">HAVEN</div>
          <div class="title">Verification Code</div>
          <p class="text">Please use the following 6-digit verification code to sign in to your Haven Restaurant & Lounge account.</p>
          <div class="otp-box">${otp}</div>
          <p class="text">This code will expire in <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>
          <div class="footer">&copy; ${new Date().getFullYear()} Haven Restaurant & Lounge. All rights reserved.</div>
        </div>
      </body>
    </html>
  `;
}

export async function sendOtpEmail(toEmail: string, otp: string): Promise<boolean> {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@havenrestaurant.com';

  if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY.includes('your_sendgrid')) {
    // Dev-only: log that OTP was "sent" but never log the OTP value itself
    console.warn(`[DEV LOG] SendGrid not configured. OTP delivery skipped for ${toEmail}.`);
    return true;
  }

  const msg = {
    to: toEmail,
    from: fromEmail,
    subject: 'Your Haven verification code',
    html: buildOtpEmailHtml(otp),
  };

  try {
    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('SendGrid OTP delivery error:', error);
    throw new Error('Failed to deliver verification email');
  }
}

// ─── Password Reset Email ─────────────────────────────────────────────────

export function buildPasswordResetEmailHtml(otp: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0d0f12; color: #f3f4f6; margin: 0; padding: 40px 20px; }
          .container { max-width: 500px; margin: 0 auto; background-color: #161920; border: 1px solid #2a2e39; border-radius: 12px; padding: 32px; text-align: center; }
          .logo { font-size: 24px; font-weight: 700; color: #d97706; letter-spacing: 1px; margin-bottom: 8px; }
          .title { font-size: 18px; font-weight: 600; color: #ffffff; margin-bottom: 24px; }
          .otp-box { background-color: #222632; border: 1px dashed #d97706; border-radius: 8px; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #f59e0b; padding: 16px; margin: 24px 0; }
          .text { font-size: 14px; color: #9ca3af; line-height: 1.5; margin-bottom: 16px; }
          .warning { font-size: 13px; color: #f87171; background-color: #2d1515; border: 1px solid #7f1d1d; border-radius: 8px; padding: 12px 16px; margin: 16px 0; }
          .footer { font-size: 12px; color: #6b7280; border-top: 1px solid #2a2e39; padding-top: 16px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">HAVEN</div>
          <div class="title">Password Reset Request</div>
          <p class="text">Someone requested a password reset for your Haven Restaurant &amp; Lounge account. Use the code below to set a new password.</p>
          <div class="otp-box">${otp}</div>
          <p class="text">This code expires in <strong>10 minutes</strong>.</p>
          <div class="warning">If you did not request this reset, you can safely ignore this email — your password will not change.</div>
          <div class="footer">&copy; ${new Date().getFullYear()} Haven Restaurant &amp; Lounge. All rights reserved.</div>
        </div>
      </body>
    </html>
  `;
}

export async function sendPasswordResetEmail(toEmail: string, otp: string): Promise<boolean> {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@havenrestaurant.com';

  if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY.includes('your_sendgrid')) {
    console.warn(`[DEV LOG] SendGrid not configured. Password reset OTP delivery skipped for ${toEmail}.`);
    return true;
  }

  const msg = {
    to: toEmail,
    from: fromEmail,
    subject: 'Haven Restaurant — Password Reset Code',
    html: buildPasswordResetEmailHtml(otp),
  };

  try {
    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('SendGrid password reset delivery error:', error);
    throw new Error('Failed to deliver password reset email');
  }
}

