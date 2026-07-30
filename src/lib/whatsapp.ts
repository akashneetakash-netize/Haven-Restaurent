import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM || '+14155238886';

const twilioClient = accountSid && authToken && !accountSid.includes('your_twilio')
  ? twilio(accountSid, authToken)
  : null;

export async function sendWhatsAppOtp(phone: string, otp: string): Promise<boolean> {
  const formattedFrom = fromWhatsApp.startsWith('whatsapp:') ? fromWhatsApp : `whatsapp:${fromWhatsApp}`;
  const formattedTo = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;

  if (!twilioClient) {
    console.warn(`[DEV LOG] Twilio credentials not set. WhatsApp OTP for ${phone}: ${otp}`);
    return true;
  }

  try {
    await twilioClient.messages.create({
      from: formattedFrom,
      to: formattedTo,
      body: `Your Haven Restaurant verification code is: ${otp} (expires in 5 minutes).`,
    });
    return true;
  } catch (error: any) {
    console.error('Twilio WhatsApp error:', error);
    throw new Error(error.message || 'Failed to deliver WhatsApp verification code');
  }
}
