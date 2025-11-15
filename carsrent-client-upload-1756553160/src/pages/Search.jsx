// client/src/pages/Search.jsx
import React, { useEffect, useState } from 'react';
import { searchCars } from '../api';
import { useI18n } from '../i18n.jsx';
import { Link } from 'react-router-dom';

// Cities to filter by (first option means "no location filter")
const CITIES = [
  'Anywhere',
  'Casablanca','Rabat','Marrakesh','Tangier','Agadir','Fès','Meknès',
  'Kenitra','Salé','Oujda','Tétouan','Safi','El Jadida','Khouribga',
  'Béni Mellal','Nador','Laayoune','Dakhla','Essaouira'
];

// Categories (first option means "no category filter")
const CATEGORIES = [
  'Any',
  'sedan','suv','hatchback','pickup','van',
  'convertible','coupe','wagon','crossover'
];

function InputWithSuffix({ value, onChange, placeholder, suffix = 'MAD' }) {
  return (
    <div className="input-suffix">
      <input
        className="input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      <span className="suffix">{suffix}</span>
    </div>
  );
}

// format numbers like 35 000
const fmtMAD = (n) =>
  new Intl.NumberFormat('fr-MA').format(Math.round(Number(n) || 0));

export default function Search() {
  const { t } = useI18n();

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Filters
  const [location, setLocation] = useState('Anywhere');
  const [category, setCategory] = useState('Any');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [chauffeur, setChauffeur] = useState('any');
  const [delivery, setDelivery] = useState('any'); // 👈 NEW livraison filter

  const load = async () => {
    setErr('');
    setLoading(true);
    try {
      const params = {
        location: location === 'Anywhere' ? '' : location,
        category: category === 'Any' ? '' : category,
        minPrice: minPrice || '',
        maxPrice: maxPrice || '',
        chauffeur: chauffeur === 'any' ? '' : chauffeur,
        // 👇 NEW: send delivery to backend
        delivery: delivery === 'any' ? '' : delivery,
      };
      const data = await searchCars(params);
      setCars(data || []);
    } catch (e) {
      console.error(e);
      setErr(e?.error || e?.message || 'Error while loading cars');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    load();
  };

  return (
    <div className="container">
      {/* Filters card */}
      <div className="card">
        <h1 className="h2">{t('nav.search') || 'Search cars'}</h1>
        <form className="filters" onSubmit={onSubmit}>
          {/* Row 1: City + Category */}
          <div className="grid grid-3 gap-sm">
            <div>
              <label className="label">City</label>
              <select
                className="input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Chauffeur</label>
              <select
                className="input"
                value={chauffeur}
                onChange={(e) => setChauffeur(e.target.value)}
              >
                <option value="any">Any</option>
                <option value="yes">Avec chauffeur</option>
                <option value="no">Sans chauffeur</option>
                <option value="on_demand">Sur demande</option>
              </select>
            </div>
          </div>

          {/* Row 2: Price + Livraison */}
          <div className="grid grid-3 gap-sm" style={{ marginTop: 12 }}>
            <div>
              <label className="label">Min price / day</label>
              <InputWithSuffix
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="ex: 200"
              />
            </div>

            <div>
              <label className="label">Max price / day</label>
              <InputWithSuffix
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="ex: 1500"
              />
            </div>

            <div>
              <label className="label">Livraison</label>
              <select
                className="input"
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
              >
                <option value="any">Any</option>
                <option value="airport">Aéroport</option>
                <option value="none">Pas de livraison</option>
                <option value="custom">Personnalisée</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <button type="submit" className="btn btn-primary">
              {t('ui.search') || 'Search'}
            </button>
          </div>
        </form>

        {err && <div className="error" style={{ marginTop: 10 }}>{String(err)}</div>}
      </div>

      {/* Results */}
      {loading && (
        <div className="card" style={{ marginTop: 16 }}>
          Loading…
        </div>
      )}

      {!loading && cars.length === 0 && !err && (
        <div className="card" style={{ marginTop: 16 }}>
          No cars found with these filters.
        </div>
      )}

      <div className="cards-grid" style={{ marginTop: 16 }}>
        {cars.map((car) => (
          <Link
            key={car.id}
            to={`/car/${car.id}`}
            className="card car-card"
            style={{ textDecoration: 'none' }}
          >
            {car.image_url && (
              <img
                src={car.image_url}
                alt={car.title}
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  marginBottom: '8px',
                }}
                loading="lazy"
              />
            )}
            <div>
              <h2 className="h4" style={{ margin: '4px 0' }}>
                {car.title}
              </h2>
              <div className="muted" style={{ marginBottom: 4 }}>
                {fmtMAD(car.daily_price)} MAD / jour · {car.category}
              </div>
              <div className="muted">
                {car.agency_location || '—'} · {car.fuel_type}, {car.transmission}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
