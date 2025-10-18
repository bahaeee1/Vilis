// server/src/mailer.js
import { Resend } from 'resend';

const API_KEY = (process.env.RESEND_API_KEY || '').trim();
if (!API_KEY) {
  console.error('[mailer] Missing RESEND_API_KEY');
}
export const resend = new Resend(API_KEY);

const EMAIL_FROM = (process.env.EMAIL_FROM || 'Vilis <assistance@vilis-ma.com>').trim();

/** Booking email to agency */
export async function sendAgencyBookingEmail({ to, agencyName, carTitle, booking, replyTo }) {
  if (!to) throw new Error('[mailer] Missing "to" recipient address');

  const subject = `📅 Nouvelle réservation pour ${carTitle}`;
  const text = [
    `Bonjour ${agencyName},`,
    ``,
    `Une nouvelle réservation vient d'être effectuée sur Vilis.`,
    ``,
    `🚗 Voiture : ${carTitle}`,
    `👤 Client : ${booking?.customer_name || '—'}`,
    `📞 Téléphone : ${booking?.customer_phone || '—'}`,
    `📧 Email : ${booking?.customer_email || '—'}`,
    `📅 Dates : du ${booking?.start_date || '—'} au ${booking?.end_date || '—'}`,
    `💰 Prix total : ${booking?.total_price ?? '—'} MAD`,
    `📝 Message : ${booking?.message || '—'}`,
    ``,
    `Merci de contacter le client pour confirmer la réservation.`,
    ``,
    `Cordialement,`,
    `L'équipe Vilis`,
    `https://www.vilis-ma.com`,
  ].join('\n');

  const html = text.replace(/\n/g, '<br/>');

  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
    ...(replyTo ? { reply_to: replyTo, replyTo } : {}),
  });
}

/** 🔧 Simple test email so we can verify Resend quickly */
export async function sendTestEmail(to) {
  if (!to) throw new Error('Missing "to"');
  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: 'Vilis test email',
    text: 'If you see this, your RESEND_API_KEY and EMAIL_FROM are working.',
  });
}
