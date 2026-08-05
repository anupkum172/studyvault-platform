const APP_NAME = process.env.APP_NAME || 'StudyVault Pro';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || process.env.PASSWORD_RESET_FROM || '';

export const hasEmailProvider = Boolean(RESEND_API_KEY && EMAIL_FROM);

export async function sendPasswordResetEmail({ to, name, code }) {
  if (!hasEmailProvider) {
    throw new Error('Email provider is not configured. Add RESEND_API_KEY and EMAIL_FROM.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to,
      subject: `${APP_NAME} password reset code`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#0f172a">
          <h2 style="margin:0 0 12px;color:#0f766e">${APP_NAME}</h2>
          <p>Hello ${name || 'there'},</p>
          <p>Use this verification code to reset your password:</p>
          <p style="font-size:28px;font-weight:800;letter-spacing:6px;margin:18px 0;color:#0f172a">${code}</p>
          <p>This code expires in 15 minutes. If you did not request this, you can ignore this email.</p>
        </div>
      `,
      text: `${APP_NAME} password reset code: ${code}. This code expires in 15 minutes.`
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || 'Password reset email could not be sent.');
  }
}
