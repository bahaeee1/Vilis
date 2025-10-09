// server/src/mailer.js
// Sends email via Resend with good debug logs.
// Works even on Node 22+ (uses global fetch).

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'assistance@vilis-ma.com'; // safe dev sender

export async function sendAgencyBookingEmail({ to, agencyName, carTitle, booking }) {
  // Friendly guardrails & logs (visible in Render logs)
  if (!RESEND_API_KEY) {
    console.warn('[email] SKIP: RESEND_API_KEY missing. Set it in Render env.');
    return { skipped: true, reason: 'no_api_key' };
  }
  if (!to) {
    console.warn('[email] SKIP: recipient "to" missing.');
    return { skipped: true, reason: 'no_recipient' };
  }

  const subject = `New booking for ${carTitle}`;
  const text =
`Hi ${agencyName || 'there'},

You have a new booking request on Vilis:

• Car: ${carTitle}
• Customer: ${booking.customer_name}
• Phone: ${booking.customer_phone}
• Email: ${booking.customer_email || '—'}
• Dates: ${(booking.start_date || '—')} → ${(booking.end_date || '—')}
• Message: ${booking.message || '—'}

Log in to your dashboard to accept/decline.

— Vilis`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,   // For dev, 'onboarding@resend.dev' works without domain verify
      to: [to],
      subject,
      text,
    }),
  });

  const body = await res.text();

  if (!res.ok) {
    console.error('[email] FAILED', res.status, body);
    throw new Error(`Email send failed: ${res.status} ${body}`);
  }

  console.log('[email] SENT OK →', to, body);
  try { return JSON.parse(body); } catch { return { ok: true }; }
}
