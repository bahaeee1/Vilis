// client/src/pages/Car.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCar, createBooking } from '../api.js';
import { useI18n } from '../i18n.jsx';

function normalizePhone(raw) {
  if (!raw) return { display: '', digits: '' };
  const digits = raw.replace(/[^\d+]/g, '');
  const display = digits.replace(/(\+?\d{1,3})(\d{2,3})(\d{2,3})(\d{2,3})?(\d{2,3})?/,
    (_, a, b, c, d = '', e = '') => [a, b, c, d, e].filter(Boolean).join(' ')
  );
  return { display: display || digits, digits };
}

export default function Car() {
  const { id } = useParams();
  const { t, lang } = useI18n();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const [customer_name, setCustomerName]   = useState('');
  const [customer_phone, setCustomerPhone] = useState('');
  const [customer_email, setCustomerEmail] = useState('');
  const [start_date, setStartDate]         = useState('');
  const [end_date, setEndDate]             = useState('');
  const [message, setMessage]              = useState('');
  const [submitting, setSubmitting]        = useState(false);

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

  const specs = useMemo(() => {
    if (!car) return [];
    return [
      car.year && { label: String(car.year) },
      car.transmission && { label: car.transmission },
      car.seats && { label: `${car.seats} ${lang === 'fr' ? 'places' : 'seats'}` },
      car.doors && { label: `${car.doors} ${lang === 'fr' ? 'portes' : 'doors'}` },
      car.trunk_liters && { label: `${car.trunk_liters}L ${lang === 'fr' ? 'coffre' : 'trunk'}` },
      car.fuel_type && { label: car.fuel_type }
    ].filter(Boolean);
  }, [car, lang]);

  const phone = useMemo(
    () => normalizePhone(car?.agency_phone || ''),
    [car?.agency_phone]
  );

  function looksLikeEmail(v) {
    return /\S+@\S+\.\S+/.test(String(v));
  }

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setOk('');

    if (!customer_name.trim() || !customer_phone.trim()) {
      setErr(lang === 'fr'
        ? 'Nom et téléphone sont obligatoires.'
        : 'Name and phone are required.'
      );
      return;
    }
    if (customer_email && !looksLikeEmail(customer_email)) {
      setErr(lang === 'fr' ? 'Email invalide.' : 'Invalid email.');
      return;
    }

    try {
      setSubmitting(true);
      await createBooking({
        car_id: Number(id),
        customer_name: customer_name.trim(),
        customer_phone: customer_phone.trim(),
        customer_email: customer_email.trim() || null,  // optional
        start_date: start_date || null,
        end_date: end_date || null,
        message: message.trim() || null
      });
      setOk(lang === 'fr' ? 'Demande envoyée !' : 'Request sent!');
      setCustomerName(''); setCustomerPhone(''); setCustomerEmail('');
      setStartDate(''); setEndDate(''); setMessage('');
    } catch (e) {
      setErr(e?.error || 'Error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="container py-10 text-muted-foreground">Loading…</div>;
  if (!car)     return <div className="container py-10 text-destructive">{err || 'Not found'}</div>;

  return (
    <div className="container py-8 space-y-8">
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="card p-0 overflow-hidden">
          {car.image_url ? (
            <img src={car.image_url} alt={car.title} className="w-full h-72 object-cover" />
          ) : (
            <div className="h-72 flex items-center justify-center text-muted-foreground">(no image)</div>
          )}
        </div>

        <div className="card space-y-4">
          <h1 className="text-3xl font-bold">{car.title}</h1>

          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-semibold">{car.daily_price} MAD</div>
            <div className="text-muted-foreground">{t('car.price_per_day')}</div>
          </div>

          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            {specs.map((s, i) => <li key={i}>{s.label}</li>)}
          </ul>

          <div className="mt-2 space-y-2">
            <div className="text-lg font-medium">
              {car.agency_name}{' '}
              <span className="text-muted-foreground">
                • {car.location || (lang === 'fr' ? 'Ville inconnue' : 'Unknown city')}
              </span>
            </div>

            {phone.display ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground select-none">{t('tel')}:</span>
                <a className="btn btn-ghost btn-sm max-w-xs truncate" title={phone.display} href={`tel:${phone.digits}`}>
                  {phone.display}
                </a>
                {phone.digits && (
                  <a className="btn btn-ghost btn-sm" target="_blank" rel="noreferrer"
                     href={`https://wa.me/${phone.digits.replace(/[^\d]/g, '')}`}>
                    WhatsApp
                  </a>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {lang === 'fr' ? 'Téléphone non fourni' : 'Phone not provided'}
              </div>
            )}

            <div>
              <Link to={`/agency/${car.agency_id}`} className="btn btn-sm">
                {t('btn.agency_catalog')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">
          {lang === 'fr' ? 'Demande de réservation' : 'Booking request'}
        </h2>

        <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">{t('forms.name')}</label>
            <input className="input" value={customer_name}
              onChange={(e) => setCustomerName(e.target.value)} placeholder={t('forms.name')} required />
          </div>

          <div>
            <label className="label">{t('forms.phone')}</label>
            <input className="input" value={customer_phone}
              onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+212…" required />
          </div>

          <div>
            <label className="label">{t('forms.email')}</label>
            <input className="input" type="email" value={customer_email}
              onChange={(e) => setCustomerEmail(e.target.value)} placeholder="name@email.com" />
          </div>

          <div>
            <label className="label">{t('forms.start_date')}</label>
            <input className="input" type="date" value={start_date}
              onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div>
            <label className="label">{t('forms.end_date')}</label>
            <input className="input" type="date" value={end_date}
              onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <label className="label">{t('forms.message')}</label>
            <textarea className="textarea" rows={3} value={message}
              onChange={(e) => setMessage(e.target.value)} placeholder={t('forms.message')} />
          </div>

          {err ? <div className="md:col-span-2 text-destructive">{err}</div> : null}
          {ok  ? <div className="md:col-span-2 text-green-500">{ok}</div> : null}

          <div className="md:col-span-2">
            <button className="btn" disabled={submitting}>
              {submitting ? (lang === 'fr' ? 'Envoi…' : 'Sending…') : (lang === 'fr' ? 'Envoyer la demande' : 'Send request')}
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
