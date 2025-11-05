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

function pickChauffeurValue(car) {
  const candidates = [
    car?.chauffeur,
    car?.chauffeur_included,
    car?.with_driver,
    car?.driver,
    car?.has_chauffeur,
    car?.options?.chauffeur,
    car?.features?.chauffeur,
    car?.extras?.chauffeur,
    car?.details?.chauffeur,
  ];
  for (const v of candidates) if (v !== null && v !== undefined) return v;
  return null;
}

function formatChauffeurLabel(v) {
  if (v === null || v === undefined || String(v).trim() === '') return '—';
  const s = String(v).toLowerCase().trim();
  if (['yes','true','1','included','incl','avec','with'].includes(s)) return 'Inclus';
  if (['no','false','0','not included','non','sans'].includes(s)) return 'Non inclus';
  if (['on_demand','on-demand','ondemand','sur demande'].includes(s)) return 'Sur demande';
  return String(v); // fallback: show raw
}


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

{/* INFO BOXES */}
<div
  style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginTop: '24px',
    alignItems: 'stretch',
    justifyContent: 'flex-start'
  }}
>
  {/* CATEGORY */}
  {car?.category && (
    <div style={infoBoxStyle}>
      <div style={labelStyle}>Category:</div>
      <div style={valueStyle}>{car.category}</div>
    </div>
  )}

  {/* TRANSMISSION */}
  {car?.transmission && (
    <div style={infoBoxStyle}>
      <div style={labelStyle}>Transmission:</div>
      <div style={valueStyle}>{car.transmission}</div>
    </div>
  )}

  {/* KILOMÉTRAGE */}
  {car?.mileage_limit && (
    <div style={infoBoxStyle}>
      <div style={labelStyle}>Kilométrage:</div>
      <div style={valueStyle}>{car.mileage_limit}</div>
    </div>
  )}

  {/* ASSURANCE */}
  {car?.insurance && (
    <div style={infoBoxStyle}>
      <div style={labelStyle}>Assurance:</div>
      <div style={{ ...valueStyle, textTransform: 'none' }}>{car.insurance}</div>
    </div>
  )}

  {/* ÂGE MINIMUM */}
  {(car?.min_age != null) && (
    <div style={infoBoxStyle}>
      <div style={labelStyle}>Âge minimum:</div>
      <div style={valueStyle}>{car.min_age} ans</div>
    </div>
  )}

  {/* CARBURANT */}
  {car?.fuel_type && (
    <div style={infoBoxStyle}>
      <div style={labelStyle}>Carburant:</div>
      <div style={valueStyle}>{car.fuel_type}</div>
    </div>
  )}

  {/* CHAUFFEUR */}
<div style={infoBoxStyle}>
  <div style={labelStyle}>Chauffeur:</div>
  <div style={valueStyle}>
    {formatChauffeurLabel(pickChauffeurValue(car))}
  </div>
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
{/* Tarification (tiers) */}
{tariffs && (
  <section
    className="tariff mt-lg"
    style={{ marginBottom: "40px" }} // adds distance below boxes
  >
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "16px",
        justifyContent: "center",
        marginTop: "24px", // little more space above boxes too
      }}
    >
      {/* Per Day */}
      <div
        style={{
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
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
        }}
      >
        <div style={{ fontSize: "20px", fontWeight: "800", color: "#60a5fa" }}>
          MAD {fmtMAD(tariffs.dayTotal)}
        </div>
        <div style={{ fontSize: "16px", fontWeight: "700" }}>/ jour</div>
      </div>

      {/* Per Week */}
      <div
        style={{
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
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
        }}
      >
        <div style={{ fontSize: "20px", fontWeight: "800", color: "#60a5fa" }}>
          MAD {fmtMAD(tariffs.weekTotal)}
        </div>
        <div style={{ fontSize: "16px", fontWeight: "700" }}>/ semaine</div>
      </div>

      {/* Per Month */}
      <div
        style={{
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
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
        }}
      >
        <div style={{ fontSize: "20px", fontWeight: "800", color: "#60a5fa" }}>
          MAD {fmtMAD(tariffs.monthTotal)}
        </div>
        <div style={{ fontSize: "16px", fontWeight: "700" }}>/ mois</div>
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
