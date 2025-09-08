import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCar, createBooking } from '../api.js';
import { useI18n } from '../i18n.jsx';

export default function Car() {
  const { id } = useParams();
  const { t, lang } = useI18n();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);

  // booking form state
  const [customer_name, setCustomerName] = useState('');
  const [customer_phone, setCustomerPhone] = useState('');
  const [customer_email, setCustomerEmail] = useState('');
  const [start_date, setStartDate] = useState('');
  const [end_date, setEndDate] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getCar(id);
        setCar(data);
      } catch (e) {
        setErr(e?.error || 'Error');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setOk('');

    if (!customer_name.trim() || !customer_phone.trim()) {
      setErr(lang === 'fr' ? 'Nom et téléphone sont obligatoires.' : 'Name and phone are required.');
      return;
    }

    try {
      setSubmitting(true);
      await createBooking({
        car_id: Number(id),
        customer_name: customer_name.trim(),
        customer_phone: customer_phone.trim(),
        customer_email: customer_email.trim() || null,
        start_date: start_date || null,
        end_date: end_date || null,
        message: message.trim() || null
      });
      setOk(lang === 'fr' ? 'Demande envoyée !' : 'Request sent!');
      // reset form
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setStartDate('');
      setEndDate('');
      setMessage('');
    } catch (e) {
      setErr(e?.error || 'Error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="container py-8 text-muted-foreground">Loading...</div>;
  if (!car) return <div className="container py-8 text-destructive">{err || 'Not found'}</div>;

  return (
    <div className="container py-8 space-y-8">
      {/* Car header */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-0 overflow-hidden">
          {car.image_url ? (
            <img src={car.image_url} alt={car.title} className="w-full h-64 object-cover" />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              (no image)
            </div>
          )}
        </div>

        <div className="card space-y-3">
          <h1 className="text-2xl font-semibold">{car.title}</h1>
          <div className="text-xl font-medium">
            {car.daily_price} MAD <span className="text-muted-foreground">{t('car.price_per_day')}</span>
          </div>

          <div className="text-sm text-muted-foreground">
            {car.year ? <span className="mr-3">{car.year}</span> : null}
            {car.transmission ? <span className="mr-3">{car.transmission}</span> : null}
            {car.seats ? <span className="mr-3">{car.seats} seats</span> : null}
            {car.doors ? <span className="mr-3">{car.doors} doors</span> : null}
            {car.trunk_liters ? <span className="mr-3">{car.trunk_liters}L trunk</span> : null}
            {car.fuel_type ? <span className="mr-3">{car.fuel_type}</span> : null}
          </div>

          <div className="pt-2">
            <div className="font-medium">
              {car.agency_name}{' '}
              <span className="text-muted-foreground">• {car.location || '—'}</span>
            </div>
            {car.agency_phone ? (
              <div className="text-sm">
                {t('tel')}: <a className="link" href={`tel:${car.agency_phone}`}>{car.agency_phone}</a>
              </div>
            ) : null}
            <div className="pt-2">
              <Link to={`/agency/${car.agency_id}`} className="btn btn-ghost btn-sm">
                {t('btn.agency_catalog')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Booking form */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">
          {lang === 'fr' ? 'Demande de réservation' : 'Booking request'}
        </h2>

        <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">{t('forms.name')}</label>
            <input
              className="input"
              value={customer_name}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={t('forms.name')}
              required
            />
          </div>
          <div>
            <label className="label">{t('forms.phone')}</label>
            <input
              className="input"
              value={customer_phone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+212..."
              required
            />
          </div>
          <div>
            <label className="label">{t('forms.email')}</label>
            <input
              className="input"
              type="email"
              value={customer_email}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="name@email.com"
            />
          </div>
          <div>
            <label className="label">{t('forms.start_date')}</label>
            <input
              className="input"
              type="date"
              value={start_date}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">{t('forms.end_date')}</label>
            <input
              className="input"
              type="date"
              value={end_date}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">{t('forms.message')}</label>
            <textarea
              className="textarea"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('forms.message')}
            />
          </div>

          {err ? <div className="md:col-span-2 text-destructive">{err}</div> : null}
          {ok ? <div className="md:col-span-2 text-green-500">{ok}</div> : null}

          <div className="md:col-span-2">
            <button className="btn" disabled={submitting}>
              {submitting
                ? (lang === 'fr' ? 'Envoi...' : 'Sending...')
                : (lang === 'fr' ? 'Envoyer la demande' : 'Send request')}
            </button>
          </div>
        </form>
      </div>

      <div>
        <Link to="/" className="link">{t('misc.back')}</Link>
      </div>
    </div>
  );
}
