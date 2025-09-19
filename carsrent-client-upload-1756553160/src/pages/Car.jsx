// client/src/pages/Car.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCar, createBooking } from '../api';
import { useI18n } from '../i18n';

export default function CarPage() {
  const { id } = useParams();
  const { t } = useI18n();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  // booking form state
  const [customer_name, setName] = useState('');
  const [customer_phone, setPhone] = useState('');
  const [customer_email, setEmail] = useState(''); // optional for clients
  const [start_date, setStart] = useState('');
  const [end_date, setEnd] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
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

  // 🛡️ live validation: end date must be on/after start date (only if both filled)
  const dateError = useMemo(() => {
    if (!start_date || !end_date) return '';
    const s = new Date(start_date);
    const e = new Date(end_date);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return '';
    if (e < s) return 'End date must be on or after start date.';
    return '';
  }, [start_date, end_date]);

  const canSubmit = useMemo(() => {
    // name & phone required; email optional for clients
    if (!customer_name.trim() || !customer_phone.trim()) return false;
    if (dateError) return false;
    return true;
  }, [customer_name, customer_phone, dateError]);

  async function book() {
    setErr('');
    setOk('');
    if (!canSubmit) {
      setErr(dateError || 'Please fill the required fields.');
      return;
    }

    try {
      await createBooking({
        car_id: Number(id),
        customer_name,
        customer_phone,
        customer_email: customer_email || null,
        start_date: start_date || null,
        end_date: end_date || null,
        message: message || null
      });
      setOk('Request sent! The agency will contact you soon.');
      // clear inputs (keep dates to let users tweak easily)
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch (e) {
      setErr(e?.error || 'Booking failed');
    }
  }

  if (loading) return <div className="container"><div className="card">Loading…</div></div>;
  if (!car) return <div className="container"><div className="card">{err || 'Not found'}</div></div>;

  const whatsappHref = car.agency_phone
    ? `https://wa.me/${car.agency_phone.replace(/\D/g, '')}`
    : null;

  return (
    <div className="container">
      {/* Car header */}
      <div className="card">
        <div className="grid grid-2 gap-md">
          <div>
            {car.image_url && (
              <img
                src={car.image_url}
                alt={car.title}
                style={{ width: '100%', maxWidth: 520, height: 'auto', borderRadius: 16 }}
              />
            )}
          </div>
          <div>
            <h1 className="h2">{car.title}</h1>
            <div className="muted" style={{ marginTop: 6 }}>
              <strong>{car.daily_price}</strong> MAD {t('car.price_per_day')}
            </div>

            <ul className="mt-sm muted">
              {car.year && <li>{car.year}</li>}
              {car.transmission && <li>{car.transmission}</li>}
              {car.seats && <li>{car.seats} seats</li>}
              {car.doors && <li>{car.doors} doors</li>}
              {car.fuel_type && <li>{car.fuel_type}</li>}
              {car.category && <li>{car.category}</li>}
            </ul>

            <div className="mt-sm">
              <div className="muted">
                <strong>Tel:</strong> {car.agency_phone || '—'}
              </div>
              <div className="muted">
                <strong>Agency:</strong>{' '}
                <Link to={`/agency/${car.agency_id}/cars`} className="link">
                  {car.agency_name}
                </Link>
              </div>
            </div>

            <div className="car-actions">
  {whatsappHref && (
    <a className="btn" href={whatsappHref} target="_blank" rel="noreferrer">
      WhatsApp
    </a>
  )}
  <Link className="btn btn-ghost" to={`/agency/${car.agency_id}/cars`}>
    {t('btn.agency_catalog')}
  </Link>
</div>

          </div>
        </div>
      </div>

      {/* Booking form */}
      <div className="card mt-md">
        <h2 className="h3">{t('book.req_title') || 'Booking request'}</h2>

        {err && <div className="alert error mt-sm">{String(err)}</div>}
        {ok && <div className="alert success mt-sm">{ok}</div>}
        {dateError && <div className="alert error mt-sm">{dateError}</div>}

        <div className="grid grid-2 gap-sm mt-md">
          <div>
            <label className="label">{t('forms.name')}</label>
            <input className="input" value={customer_name} onChange={e => setName(e.target.value)} placeholder="Name" />
          </div>
          <div>
            <label className="label">{t('forms.phone')}</label>
            <input className="input" value={customer_phone} onChange={e => setPhone(e.target.value)} placeholder="+212…" />
          </div>
          <div>
            <label className="label">{t('forms.email')}</label>
            <input className="input" type="email" value={customer_email} onChange={e => setEmail(e.target.value)} placeholder="name@email.com" />
          </div>
          <div />
          <div>
            <label className="label">{t('forms.start_date')}</label>
            <input className="input" type="date" value={start_date} onChange={e => setStart(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('forms.end_date')}</label>
            <input
              className="input"
              type="date"
              value={end_date}
              min={start_date || undefined}
              onChange={e => setEnd(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="label">{t('forms.message')}</label>
            <textarea className="input" rows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder="Message (optional)"></textarea>
          </div>
        </div>

        <button className="btn btn-primary mt-md" disabled={!canSubmit} onClick={book}>
          {t('btn.create')}
        </button>
      </div>
    </div>
  );
}
