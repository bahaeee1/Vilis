// client/src/pages/Search.jsx
import React, { useEffect, useState } from 'react';
import { searchCars } from '../api';
import { useI18n } from '../i18n';
import { Link } from 'react-router-dom';

const CITIES = ['Anywhere','Casablanca','Rabat','Marrakesh','Tangier','Agadir','Fes','Kenitra','Tetouan','Oujda', 'Safi','El Jadida','Mohammedia','Beni Mellal','Nador','Laayoune','Dakhla','Essaouira','Meknes'];
const CATEGORIES = ['Any','sedan','suv','hatchback','pickup','van','convertible','coupe','wagon','crossover'];

export default function Search() {
  const { t } = useI18n();
  const [location, setLocation] = useState('Anywhere');
  const [minPrice, setMin] = useState('');
  const [maxPrice, setMax] = useState('');
  const [category, setCategory] = useState('Any'); // NEW
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    const params = {};
    if (location && location !== 'Anywhere') params.location = location;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (category && category !== 'Any') params.category = category; // NEW
    try {
      const data = await searchCars(params);
      setCars(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { run(); /* initial */ }, []);

  return (
    <div className="container">
      <div className="card">
        <h1 className="h2">{t('search.title')}</h1>

        <div className="grid grid-4 gap-sm mt-md">
          <div>
            <label className="label">{t('filter.location')}</label>
            <select className="input" value={location} onChange={e => setLocation(e.target.value)}>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="label">{t('filter.min_per_day')}</label>
            <input className="input" type="number" value={minPrice} onChange={e => setMin(e.target.value)} />
          </div>

          <div>
            <label className="label">{t('filter.max_per_day')}</label>
            <input className="input" type="number" value={maxPrice} onChange={e => setMax(e.target.value)} />
          </div>

          {/* NEW: Category filter */}
          <div>
            <label className="label">{t('forms.category') || 'Category'}</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <button className="btn btn-primary mt-md" onClick={run}>
          {t('btn.search')}
        </button>
      </div>

      <div className="grid grid-3 gap-md mt-lg">
        {loading && <div className="card">Loading…</div>}
        {!loading && cars.length === 0 && <div className="card">{t('misc.no_cars')}</div>}
        {!loading && cars.map(c => (
          <div className="card" key={c.id}>
            {c.image_url && <img src={c.image_url} alt={c.title} style={{width:'100%', height:'180px', objectFit:'cover', borderRadius:'12px'}} />}
            <h3 className="h3 mt-sm">{c.title}</h3>
            <div className="muted">{c.daily_price} MAD {t('car.price_per_day')}</div>
            <div className="muted mt-xxs">{c.location || '—'} {c.category ? `· ${c.category}` : ''}</div>
            <Link className="btn btn-ghost mt-sm" to={`/car/${c.id}`}>{t('btn.view')}</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
