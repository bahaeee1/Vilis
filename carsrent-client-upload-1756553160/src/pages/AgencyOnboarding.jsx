// client/src/pages/AgencyOnboarding.jsx
import React from 'react';

export default function AgencyOnboarding() {
  const email = 'assist@vilis.com';
  // WhatsApp requires international format without + or leading 0
  // Morocco (+212) → 0621053938  =>  212621053938
  const waNumberIntl = '212621053938';

  return (
    <div className="container">
      <div className="card">
        <h1 className="h2">Get your agency listed</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Agency accounts are created by our team. Please contact us and we’ll verify your details and set up your login.
        </p>

        <div className="car-actions">
          <a className="btn" href={`https://wa.me/${waNumberIntl}`} target="_blank" rel="noreferrer">
            WhatsApp: 0621053938
          </a>
          <a className="btn btn-ghost" href={`mailto:${email}`}>
            Email: assist@vilis.com
          </a>
        </div>

        <div className="muted" style={{ marginTop: 12, fontSize: '0.95rem' }}>
          Or reach us directly: <strong>assist@vilis.com</strong> · <strong>0621053938</strong>
        </div>
      </div>
    </div>
  );
}
