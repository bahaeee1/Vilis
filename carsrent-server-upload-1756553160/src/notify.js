import { Resend } from 'resend';
const key = process.env.RESEND_API_KEY;
const resend = key ? new Resend(key) : null;

export async function emailAgency({ to, agencyName, carTitle, dates, customer }) {
  if (!resend || !to) return;
  try {
    await resend.emails.send({
      from: 'Vilis <noreply@vilis.app>',
      to: [to],
      subject: `New booking request · ${carTitle}`,
      text:
`Hello ${agencyName},
You have a new booking request on Vilis.

Car: ${carTitle}
Dates: ${dates}
Customer: ${customer.name}
Phone: ${customer.phone}
Email: ${customer.email || '—'}

Please contact the customer to confirm.`,
    });
  } catch (e) { console.error('Email send failed', e); }
}

export async function emailCustomer({ to, agencyName, agencyPhone, carTitle, dates }) {
  if (!resend || !to) return;
  try {
    await resend.emails.send({
      from: 'Vilis <noreply@vilis.app>',
      to: [to],
      subject: `Request sent to ${agencyName}`,
      text:
`Thanks for your request!

Car: ${carTitle}
Dates: ${dates}
Agency: ${agencyName}
Phone: ${agencyPhone}

The agency will reach out to confirm availability.`,
    });
  } catch (e) { console.error('Email send failed', e); }
}
