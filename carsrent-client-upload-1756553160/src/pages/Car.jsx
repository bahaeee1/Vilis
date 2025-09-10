// client/src/pages/Car.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCar, createBooking } from '../api.js';
import { useI18n } from '../i18n.jsx';

export default function Car() {
  const { id } = useParams();
  const { t } = useI18n();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // booking form fields
  const [customer_name, setName] = useState('');
  const [customer_phone, setPhone] = useState('');
  const [customer_email, setEmail] = useState('');
  const [start_date, setStart] = useState('');
  const [end_date, setEnd] = useState('');
  const [message, setMsg] = useState('');
  const [submitMsg, setSubmitMsg] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const c = await getCar(id);
        setCar(c);
      } catch (e) {
        setErr(e?.error || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function onBook(e) {
    e.preventDefault();
    setSubmitMsg('');
    try {
      await createBooking({
        car_id: car.id,
        customer_name,
        customer_phone,
        customer_email: customer_email || null,
        start_date: start_date || null,
        end_date: end_date || null,
        message: message || null,
      });
      setSubmitMsg('Request sent! The agency will contact you.');
      setName(''); setPhone(''); setEmail(''); setStart(''); setEnd(''); setMsg('');
    } catch (e) {
      setSubmitMsg(e?.error || 'Booking failed');
    }
  }

  if (loading) return <div className="container"><div className="card">Loading…</div></div>;
  if (err) return <div className="container"><div className="card error">{err}</div></div>;
  if (!car) return null;

  return (
    <div className="container car-page">
      <div className="grid grid-2 gap-xl">
        {/* LEFT: car info */}
        <section className="card">
          {car.image_url ? (
            <img src={car.image_url} alt={car.title} className="car-hero" />
          ) : null}

          <h1 className="h1 mt-md">{car.title}</h1>

          <div className="muted mt-xs">
            <strong>{car.daily_price}</strong> MAD {t('car.price_per_day')}
          </div>

          {/* clean spec list */}
          <ul className="spec-list mt-md">
            {car.year && <li>{car.year}</li>}
            {car.transmission && <li>{car.transmission}</li>}
            {car.seats && <li>{car.seats} seats</li>}
            {car.doors && <li>{car.doors} doors</li>}
            {car.trunk_liters && <li>{car.trunk_liters}L trunk</li>}
            {car.fuel_type && <li>{car.fuel_type}</li>}
          </ul>

          {/* Agency line — keeps things tidy and never overlaps */}
          <div className="mt-lg">
            <div className="agency-line">
              <span className="muted">
                {t('tel')}:&nbsp;
                {car.agency_phone ? (
                  <a className="link" href={`tel:${car.agency_phone}`}>{car.agency_phone}</a>
                ) : (
                  <em>-</em>
                )}
              </span>

              {/* Small inline “Agency catalog” link placed near the agency name */}
              <span className="divider">•</span>
              <span className="muted">
                {t('nav.register').includes('Register') ? 'Agency' : 'Agence'}:&nbsp;
                <strong>{car.agency_name}</strong>
                &nbsp;&middot;&nbsp;
                <Link className="link" to={`/agency/${car.agency_id}`}>
                  {t('btn.agency_catalog')}
                </Link>
              </span>
            </div>

            {/* Optional WhatsApp button under contact row */}
            {car.agency_phone && (
              <div className="mt-sm">
                <a
                  className="btn btn-ghost"
                  href={`https://wa.me/${car.agency_phone.replace(/\D/g, '')}`}
                  target="_blank" rel="noreferrer"
                >
                  WhatsApp
                </a>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT: booking form */}
        <aside className="card">
          <h2 className="h2">{t('bookingRequest') || 'Booking request'}</h2>

          <form className="form mt-md" onSubmit={onBook}>
            <label className="label">{t('forms.name')}</label>
            <input className="input" value={customer_name} onChange={e => setName(e.target.value)} required />

            <label className="label mt-sm">{t('forms.phone')}</label>
            <input
              className="input"
              placeholder="+212…"
              value={customer_phone}
              onChange={e => setPhone(e.target.value)}
              required
            />

            <label className="label mt-sm">{t('forms.email')}</label>
            <input
              className="input"
              type="email"
              placeholder="name@email.com"
              value={customer_email}
              onChange={e => setEmail(e.target.value)}
            />

            <div className="grid grid-2 gap-sm mt-sm">
              <div>
                <label className="label">{t('forms.start_date')}</label>
                <input className="input" type="date" value={start_date} onChange={e => setStart(e.target.value)} />
              </div>
              <div>
                <label className="label">{t('forms.end_date')}</label>
                <input className="input" type="date" value={end_date} onChange={e => setEnd(e.target.value)} />
              </div>
            </div>

            <label className="label mt-sm">{t('forms.message')}</label>
            <textarea className="input" rows="3" value={message} onChange={e => setMsg(e.target.value)} />

            {submitMsg && <div className="mt-sm muted">{submitMsg}</div>}

            <button className="btn btn-primary mt-md" type="submit">
              {t('btn.create')}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
