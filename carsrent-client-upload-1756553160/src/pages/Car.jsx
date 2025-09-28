// client/src/pages/Car.jsx
import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCar } from '../api';

// Format MAD nicely
const fmtMAD = (n) =>
  new Intl.NumberFormat('fr-MA').format(Math.round(Number(n) || 0));

function coerceTiers(tiers) {
  try {
    if (!tiers) return [];
    if (typeof tiers === 'string') return JSON.parse(tiers) || [];
    if (Array.isArray(tiers)) return tiers;
    return [];
  } catch {
    return [];
  }
}

// Pick the daily rate for a given rental length using the car's tiers
function pickDailyRateFromTiers(dailyFallback, tiersRaw, days) {
  const tiers = coerceTiers(tiersRaw);
  if (tiers.length === 0) return Number(dailyFallback);
  for (const t of tiers) {
    const min = Number(t.minDays);
    const max =
      t.maxDays == null || t.maxDays === '' ? Infinity : Number(t.maxDays);
    if (Number.isFinite(min) && days >= min && days <= max) {
      return Number(t.price);
    }
  }
  return Number(dailyFallback);
}

export default function Car() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    return () => { alive = false; };
  }, [id]);

  const tariffs = useMemo(() => {
    if (!car) return null;
    const perDay = pickDailyRateFromTiers(car.daily_price, car.price_tiers, 1);
    const perWeek = pickDailyRateFromTiers(car.daily_price, car.price_tiers, 7);
    const perMonth = pickDailyRateFromTiers(car.daily_price, car.price_tiers, 30);
    return {
      dayTotal: perDay * 1,
      weekTotal: perWeek * 7,
      monthTotal: perMonth * 30,
    };
  }, [car]);

  if (loading) return <div className="container"><div className="card">Chargement…</div></div>;
  if (error)   return <div className="container"><div className="card alert">{error}</div></div>;
  if (!car)    return <div className="container"><div className="card alert">Véhicule introuvable</div></div>;

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
        <div className="body">
          <h1 className="h2">{car.title}</h1>
          <div className="muted">
            {car.daily_price} MAD / jour · {car.category}
          </div>
          <div className="muted">
            Agence: {car.agency_name} — {car.agency_location || '—'}
          </div>

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

          <Link className="btn btn-primary mt-md" to={`/book/${car.id}`}>
            Réserver
          </Link>
        </div>
      </div>
    </div>
  );
}
