// server/src/mailer.js
// Simple mail helper using Resend (https://resend.com)
// No extra dependency required (Node has global fetch).
// Env needed:
//  - RESEND_API_KEY
//  - EMAIL_FROM   (e.g. "Vilis <notifications@yourdomain.com>")

function htmlEscape(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function sendAgencyBookingEmail({
  to,
  agencyName,
  carTitle,
  booking
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!to || !apiKey || !from) {
    console.log('[mailer] Email disabled or missing config. Skipping send.', {
      hasTo: !!to,
      hasKey: !!apiKey,
      hasFrom: !!from,
    });
    return false;
  }

  const subject = `New booking request for "${carTitle}"`;
  const {
    customer_name,
    customer_phone,
    customer_email,
    start_date,
    end_date,
    message,
  } = booking || {};

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5">
      <h2>Hi ${htmlEscape(agencyName || 'there')},</h2>
      <p>You have a new booking request on <b>Vilis</b>.</p>

      <h3>Car</h3>
      <p><b>${htmlEscape(carTitle || '')}</b></p>

      <h3>Customer</h3>
      <ul>
        <li><b>Name:</b> ${htmlEscape(customer_name || '')}</li>
        <li><b>Phone:</b> ${htmlEscape(customer_phone || '')}</li>
        ${
          customer_email
            ? `<li><b>Email:</b> ${htmlEscape(customer_email)}</li>`
            : ''
        }
      </ul>

      <h3>Dates</h3>
      <ul>
        <li><b>Start:</b> ${htmlEscape(start_date || '—')}</li>
        <li><b>End:</b> ${htmlEscape(end_date || '—')}</li>
      </ul>

      ${
        message
          ? `<h3>Message</h3><p style="white-space:pre-wrap">${htmlEscape(message)}</p>`
          : ''
      }

      <p style="margin-top:24px;color:#666">This message was sent automatically by Vilis.</p>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[mailer] Resend error:', text);
      return false;
    }
    console.log('[mailer] Email sent to', to);
    return true;
  } catch (err) {
    console.error('[mailer] Send error:', err);
    return false;
  }
}
