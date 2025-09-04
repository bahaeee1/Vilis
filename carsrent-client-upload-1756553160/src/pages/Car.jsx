import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCar, createBooking } from '../api.js';
import { useI18n } from '../i18n.jsx';

function Spec({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return <li><b>{label}:</b> {value}</li>;
}

export default function Car() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useI18n();
  const [car, setCar] = useState(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [customer_name, setCustomerName] = useState('');
  const [customer_email, setCustomerEmail] = useState(''); // optional
  const [customer_phone, setCustomerPhone] = useState(''); // required
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => { (async () => { try { setCar(await getCar(id)); } catch {} })(); }, [id]);

  const book = async () => {
    setErr(null); setMsg(null);
    if (!customer_phone || customer_phone.trim().length < 6) {
      setErr('Phone is required (min 6 chars).');
      return;
    }
    try {
      const payload = {
        car_id: Number(id),
        start_date: startDate,
        end_date: endDate,
        customer_name,
        customer_phone
      };
      if (customer_email && customer_email.trim() !== '') payload.customer_email = customer_email;

      const r = await createBooking(payload);
      setMsg(
        `Booking created. Contact ${r.agency_name || 'the agency'} at ${r.agency_phone || 'N/A'}.\n` +
        `Dates: ${startDate} → ${endDate}\n` +
        `Total price: ${r.total_price}. Status: ${r.status}.`
      );
    } catch (e) {
      const message = e?.error?.message || e?.error || e?.message || JSON.stringify(e);
      setErr(message);
    }
  };

  if (!car) return <div className="card">{t('car.loading')}</div>;

  const agencyId = car.agency_id ?? car.agencyId;

  return (
    <div className="card">
      <h2>{car.title}</h2>
      <img style={{ width:'100%', maxHeight:360, objectFit:'cover', borderRadius:12 }}
           src={car.image_url || `https://picsum.photos/seed/${car.id}/1200/600`} alt={car.title} />
      <p className="muted">{car.brand} {car.model} · {car.location}</p>
      <p><b>{car.daily_price}{t('car.price_per_day')}</b></p>

      <h3>{t('car.agency_contact')}</h3>
      <p>
        <span
          style={{ textDecoration: 'underline', cursor: 'pointer' }}
          onClick={() => nav('/agency/' + agencyId)}
          title={t('car.view_agency_catalog')}
        >
          <b>{car.agency_name || 'Agency'}</b>
        </span>
        <br/>
        {t('tel')}: <a href={`tel:${car.agency_phone || ''}`}>{car.agency_phone || '—'}</a>
      </p>
      <button className="btn secondary" onClick={() => nav('/agency/' + agencyId)}>
        {t('car.view_agency_catalog')}
      </button>

      <h3 style={{marginTop:16}}>{t('car.specs')}</h3>
      <ul className="specs">
        <Spec label="Year" value={car.year} />
        <Spec label="Transmission" value={car.transmission} />
        <Spec label="Seats" value={car.seats} />
        <Spec label="Doors" value={car.doors} />
        <Spec label="Trunk volume (L)" value={car.trunk_liters} />
        <Spec label="Fuel type" value={car.fuel_type} />
      </ul>
      {car.options && <p className="muted">Options: {car.options}</p>}

      <h3>{t('car.choose_dates')}</h3>
      <div className="row">
        <div className="col-3"><label>{t('car.start')}</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
        <div className="col-3"><label>{t('car.end')}</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
      </div>

      <h3>{t('car.your_details')}</h3>
      <div className="row">
        <div className="col-4"><label>{t('car.name')}</label><input value={customer_name} onChange={e => setCustomerName(e.target.value)} /></div>
        <div className="col-4"><label>{t('car.email_optional')}</label><input value={customer_email} onChange={e => setCustomerEmail(e.target.value)} /></div>
        <div className="col-4"><label>{t('car.phone_required')}</label><input value={customer_phone} onChange={e => setCustomerPhone(e.target.value)} required /></div>
      </div>
      <div style={{ marginTop: 12 }}><button className="btn" onClick={book}>{t('car.book')}</button></div>

      {msg && <div className="success" style={{ marginTop: 8, whiteSpace: 'pre-line' }}>{msg}</div>}
      {err && <div className="error" style={{ marginTop: 8 }}>{String(err)}</div>}
    </div>
  );
}
