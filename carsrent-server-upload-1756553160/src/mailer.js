import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || 'Vilis <assistance@vilis-ma.com>';

/**
 * Send email to agency when a new booking is made
 * @param {Object} params
 * @param {string} params.to - Agency email address
 * @param {string} params.agencyName - Agency name
 * @param {string} params.carTitle - Car name
 * @param {Object} params.booking - Booking details
 * @param {string} [params.replyTo] - Reply-to email (usually customer)
 */
export async function sendAgencyBookingEmail({ to, agencyName, carTitle, booking, replyTo }) {
  if (!to) {
    console.error('[mailer] Missing "to" address');
    return;
  }

  try {
    const subject = `📅 Nouvelle réservation pour ${carTitle}`;
    const text = `
Bonjour ${agencyName},

Une nouvelle réservation vient d'être effectuée sur Vilis.

🚗 Voiture : ${carTitle}
👤 Client : ${booking.customer_name}
📞 Téléphone : ${booking.customer_phone}
📧 Email : ${booking.customer_email || 'Non fourni'}
📅 Dates : du ${booking.start_date} au ${booking.end_date}
💰 Prix total : ${booking.total_price || '—'} MAD
📝 Message : ${booking.message || 'Aucun'}

Merci de contacter le client pour confirmer la réservation.

Cordialement,
L'équipe Vilis
https://www.vilis-ma.com
    `;

    const payload = {
      from: EMAIL_FROM,
      to,
      subject,
      text,
    };

    if (replyTo) payload.reply_to = replyTo;

    const result = await resend.emails.send(payload);
    console.log('[mailer] Email sent:', result);
  } catch (err) {
    console.error('[mailer] Error sending email:', err);
  }
}
