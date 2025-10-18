// server/src/mailer.js
// Minimal, robust mailer via Resend HTTP API.
// No external deps. Works on Node 18+ (global fetch).

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Vilis <send@vilis-ma.com>'; // safe default
const SERVICE = 'https://api.resend.com/emails';

function sanitize(v) {
  return String(v ?? '').toString().trim();
}

function bookingHtml({ agencyName, carTitle, booking }) {
  const b = booking || {};
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;color:#111">
    <h2 style="margin:0 0 8px">Nouvelle réservation — ${sanitize(carTitle)}</h2>
    <p>Bonjour ${sanitize(agencyName) || 'Agence'},</p>
    <p>Vous avez reçu une nouvelle demande sur <strong>Vilis</strong>.</p>

    <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:12px 0">
      <tr><td style="padding:4px 8px;color:#666">Client</td><td style="padding:4px 8px">${sanitize(b.customer_name) || '—'}</td></tr>
      <tr><td style="padding:4px 8px;color:#666">Téléphone</td><td style="padding:4px 8px">${sanitize(b.customer_phone) || '—'}</td></tr>
      <tr><td style="padding:4px 8px;color:#666">Email</td><td style="padding:4px 8px">${sanitize(b.customer_email) || '—'}</td></tr>
      <tr><td style="padding:4px 8px;color:#666">Période</td><td style="padding:4px 8px">${sanitize(b.start_date) || '—'} → ${sanitize(b.end_date) || '—'}</td></tr>
      <tr><td style="padding:4px 8px;color:#666">Message</td><td style="padding:4px 8px">${sanitize(b.message) || '—'}</td></tr>
      ${b.total_price ? `<tr><td style="padding:4px 8px;color:#666">Total estimé</td><td style="padding:4px 8px">${sanitize(b.total_price)} MAD</td></tr>` : ''}
    </table>

    <p style="margin-top:16px">
      Connectez-vous à votre tableau de bord pour accepter/refuser la demande.
    </p>
    <p style="color:#666;margin-top:20px">— Équipe Vilis</p>
  </div>
  `;
}

export async function sendAgencyBookingEmail({ to, agencyName, carTitle, booking, cc, bcc, replyTo }) {
  if (!RESEND_API_KEY) {
    console.warn('[email] SKIP — RESEND_API_KEY not set');
    return { ok: false, skipped: true, reason: 'no_api_key' };
  }
  if (!to) {
    console.warn('[email] SKIP — missing recipient "to"');
    return { ok: false, skipped: true, reason: 'no_recipient' };
  }

  const subject = `Nouvelle réservation — ${sanitize(carTitle) || 'Véhicule'}`;
  const text =
`Bonjour ${sanitize(agencyName) || 'Agence'},

Vous avez une nouvelle demande de réservation sur Vilis.

Véhicule : ${sanitize(carTitle)}
Client   : ${sanitize(booking?.customer_name) || '—'}
Téléphone: ${sanitize(booking?.customer_phone) || '—'}
Email    : ${sanitize(booking?.customer_email) || '—'}
Période  : ${sanitize(booking?.start_date) || '—'} → ${sanitize(booking?.end_date) || '—'}
Message  : ${sanitize(booking?.message) || '—'}
${booking?.total_price ? `Total estimé : ${sanitize(booking.total_price)} MAD\n` : ''}

Connectez-vous au tableau de bord pour traiter la demande.

— Vilis`;

  const payload = {
    from: EMAIL_FROM,                 // e.g., "Vilis <send@vilis-ma.com>"
    to: Array.isArray(to) ? to : [to],
    ...(cc ? { cc } : {}),
    ...(bcc ? { bcc } : {}),
    ...(replyTo ? { reply_to: replyTo } : {}),
    subject,
    text,
    html: bookingHtml({ agencyName, carTitle, booking }),
  };

  let res;
  try {
    res = await fetch(SERVICE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[email] NETWORK ERROR', err);
    return { ok: false, error: 'network_error', detail: String(err) };
  }

  const bodyText = await res.text();
  if (!res.ok) {
    console.error('[email] FAILED', res.status, bodyText);
    return { ok: false, status: res.status, body: bodyText };
  }

  console.log('[email] SENT OK →', to, bodyText);
  try { return { ok: true, ...JSON.parse(bodyText) }; }
  catch { return { ok: true }; }
}

// Simple sanity probe you can call from a health route or shell.
export async function sendTestEmail(to = 'delivered@resend.dev') {
  return sendAgencyBookingEmail({
    to,
    agencyName: 'Test Agency',
    carTitle: 'Test Car',
    booking: {
      customer_name: 'Alice',
      customer_phone: '0600-000000',
      start_date: '2025-10-10',
      end_date: '2025-10-12',
      message: 'Test booking',
      total_price: 999,
    },
  });
}
