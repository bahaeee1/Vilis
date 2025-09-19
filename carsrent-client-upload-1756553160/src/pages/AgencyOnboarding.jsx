// client/src/pages/AgencyOnboarding.jsx
import React from 'react';

export default function AgencyOnboarding() {
  const email = 'assist@vilis.com';
  // WhatsApp link must use international format without + or leading 0
  // Morocco (+212) → 0621053938  =>  212621053938
  const waNumberIntl = '212621053938';
  const phoneLocal = '0621053938';

  return (
    <div className="container">
      <div className="card">
        <h1 className="h2">Register your agency</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Agency accounts are created by our team. Contact us and we’ll verify your details and set up your login.
        </p>

        <div className="car-actions">
          <a className="btn" href={`https://wa.me/${waNumberIntl}`} target="_blank" rel="noreferrer">
            WhatsApp: {phoneLocal}
          </a>
          <a className="btn btn-ghost" href={`mailto:${email}`}>
            Email: {email}
          </a>
        </div>

        {/* ---- Bottom contact block on this page ---- */}
        <hr className="divider" />
        <div className="footer-contact">
          <div><strong>Email:</strong> <a className="link" href={`mailto:${email}`}>{email}</a></div>
          <div><strong>Phone:</strong> <a className="link" href={`https://wa.me/${waNumberIntl}`} target="_blank" rel="noreferrer">{phoneLocal}</a></div>
        </div>
      </div>
    </div>
  );
}
