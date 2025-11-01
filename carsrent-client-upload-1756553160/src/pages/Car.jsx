// client/src/pages/Car.jsx
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCar } from '../api';

// ---- Reusable styles ----
const infoBoxStyle = {
  width: "200px",
  height: "120px",
  borderRadius: "16px",
  background: "rgba(255, 255, 255, 0.08)",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  color: "#ffffff",
  textAlign: "center",
  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
};

const labelStyle = {
  fontSize: "16px",
  fontWeight: "700",
  marginBottom: "6px",
  color: "#ffffff",
};

const valueStyle = {
  fontSize: "20px",
  fontWeight: "800",
  color: "#60a5fa",
  textTransform: "capitalize",
};


const API_BASE = import.meta.env.VITE_API_BASE;

// format numbers like 35 000
const fmtMAD = (n) =>
  new Intl.NumberFormat('fr-MA').format(Math.round(Number(n) || 0));

function coerceTiers(tiers) {
  try {
    if (!tiers) return [];
    if (typeof tiers === 'string') return JSON.parse(tiers) || [];
    return Array.isArray(tiers) ? tiers : [];
  } catch {
    return [];
  }
}

function pickDailyRateFromTiers(dailyFallback, tiersRaw, days) {
  const tiers = coerceTiers(tiersRaw);
  if (tiers.length === 0) return Number(dailyFallback);
  for (const t of tiers) {
    const min = Number(t.minDays);
    const max =
      t.maxDays == null || t.maxDays === '' ? Infinity : Number(t.maxDays);
    if (Number.isFinite(min) && days >= min && days <= max) return Number(t.price);
  }
  return Number(dailyFallback);
}

export default function Car() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // booking form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const c = await getCar(id);
        if (alive) setCar(c);
      } catch (e) {
        setError((e && (e.error || e.message)) || 'Erreur de chargement');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const tariffs = useMemo(() => {
    if (!car) return null;
    const perDay = pickDailyRateFromTiers(car.daily_price, car.price_tiers, 1);
    const perWeek = pickDailyRateFromTiers(car.daily_price, car.price_tiers, 7);
    const perMonth = pickDailyRateFromTiers(car.daily_price, car.price_tiers, 30);
    return {
      perDay,
      dayTotal: perDay * 1,
      weekTotal: perWeek * 7,
      monthTotal: perMonth * 30,
    };
  }, [car]);

  const waPhone = useMemo(() => {
    if (!car?.agency_phone) return '';
    // digits only; if starts with 0 and length >= 9, keep as is (your agents know their country code)
    return String(car.agency_phone).replace(/\D/g, '');
  }, [car]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!car) return;
    if (!name.trim() || !phone.trim() || !start || !end) {
      setResult({ error: 'Veuillez remplir tous les champs.' });
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          car_id: car.id,
          name: name.trim(),
          phone: phone.trim(),
          start_date: start,
          end_date: end,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw data || { error: 'Erreur' };
      setResult({
        ok: true,
        price: data.price?.total ?? data.booking?.price_total,
        days: data.days,
      });
      // keep the form values so the user can message via WhatsApp with same dates
    } catch (err) {
      setResult({ error: err?.error || err?.message || 'Erreur' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card">Chargement…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container">
        <div className="card alert">{error}</div>
      </div>
    );
  }
  if (!car) {
    return (
      <div className="container">
        <div className="card alert">Véhicule introuvable</div>
      </div>
    );
  }

  const waText = encodeURIComponent(
    `Bonjour, je suis intéressé par "${car.title}".\nDates: ${start || '—'} → ${end || '—'}\nNom: ${name || '—'}\nTéléphone: ${phone || '—'}`
  );
  const waHref = waPhone ? `https://wa.me/${waPhone}?text=${waText}` : null;

  return (
    <div className="container">
      <div className="card">
        {car.image_url && (
          <img
            src={car.image_url}
            alt={car.title}
            style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }}
            loading="lazy"
          />
        )}

{/* CAR INFO BOXES */}
<div
  style={{
    display: "flex",
    justifyContent: "center",
    gap: "24px",
    marginTop: "30px",
    flexWrap: "wrap", // wraps on small screens
  }}
>
  {/* CATEGORY BOX */}
  {car?.category && (
    <div style={infoBoxStyle}>
      <div style={labelStyle}>Category:</div>
      <div style={valueStyle}>{car.category}</div>
    </div>
  )}

  {/* TRANSMISSION BOX */}
  {car?.transmission && (
    <div style={infoBoxStyle}>
      <div style={labelStyle}>Transmission:</div>
      <div style={valueStyle}>{car.transmission}</div>
    </div>
  )}

  {/* KILOMÉTRAGE BOX */}
  <div style={infoBoxStyle}>
    <div style={labelStyle}>Kilométrage:</div>
    <div style={valueStyle}>Illimité</div>
  </div>

  {/* ASSURANCE BOX */}
  <div style={infoBoxStyle}>
    <div style={labelStyle}>Assurance:</div>
    <div style={valueStyle}>Incluse</div>
  </div>

  {/* ÂGE MINIMUM BOX */}
  <div style={infoBoxStyle}>
    <div style={labelStyle}>Âge minimum:</div>
    <div style={valueStyle}>21 ans</div>
  </div>
</div>



        <div className="body">
          <h1 className="h2">{car.title}</h1>
          <div className="muted">
            {car.daily_price} MAD / jour · {car.category}
          </div>
          <div className="muted">
            Agence: {car.agency_name} — {car.agency_location || '—'}
          </div>

          {/* Tarification (tiers) */}
          {tariffs && (
            <section className="tariff mt-lg">
              <h3 className="tariff-title">TARIFICATION</h3>
              <div className="tariff-wrap">
                <div className="tariff-pill">
                  <div className="tariff-price">MAD {fmtMAD(tariffs.dayTotal)}</div>
                  <div className="tariff-unit">/ jour</div>
                </div>
                <div className="tariff-pill">
                  <div className="tariff-price">MAD {fmtMAD(tariffs.weekTotal)}</div>
                  <div className="tariff-unit">/ semaine</div>
                </div>
                <div className="tariff-pill">
                  <div className="tariff-price">MAD {fmtMAD(tariffs.monthTotal)}</div>
                  <div className="tariff-unit">/ mois</div>
                </div>
              </div>
            </section>
          )}

          {/* Contact quick actions */}
          <div className="mt-md" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {waHref && (
              <a className="btn btn-primary" href={waHref} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            )}
            {car.agency_phone && (
              <a className="btn btn-ghost" href={`tel:${car.agency_phone}`}>
                Appeler: {car.agency_phone}
              </a>
            )}
            {car.agency_email && (
              <a className="btn btn-ghost" href={`mailto:${car.agency_email}`}>
                Email: {car.agency_email}
              </a>
            )}
          </div>

          {/* Booking form */}
          <form className="form mt-md" onSubmit={onSubmit} noValidate>
            <div className="grid grid-2 gap-sm">
              <div>
                <label className="label">Nom complet</label>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                />
              </div>
              <div>
                <label className="label">Téléphone</label>
                <input
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-2 gap-sm mt-sm">
              <div>
                <label className="label">Date début</label>
                <input
                  className="input"
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Date fin</label>
                <input
                  className="input"
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  required
                />
              </div>
            </div>

            {result?.price && (
              <div className="muted mt-xxs">
                Total estimé: <strong>{fmtMAD(result.price)} MAD</strong>
              </div>
            )}
            {result?.error && <div className="alert mt-xxs">{result.error}</div>}
            {result?.ok && <div className="success mt-xxs">Demande envoyée ✅</div>}

            <button className="btn btn-primary mt-sm" type="submit" disabled={submitting}>
              {submitting ? 'Envoi…' : 'Réserver'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
