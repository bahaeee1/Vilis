// client/src/pages/Search.jsx
import React, { useEffect, useState } from 'react';
import { searchCars } from '../api';
import { useI18n } from '../i18n';
import { Link } from 'react-router-dom';

// Cities to filter by (first option means "no location filter")
const CITIES = [
  'Anywhere',
  'Casablanca','Rabat','Marrakesh','Tangier','Agadir','Fès','Meknès',
  'Kenitra','Salé','Oujda','Tétouan','Safi','El Jadida','Khouribga',
  'Béni Mellal','Nador','Laayoune','Dakhla','Essaouira'
];

// Categories (first option means "no category filter")
const CATEGORIES = ['Any','Luxe','SUV','Économique','Utilitaire','van'];

function InputWithSuffix({ value, onChange, placeholder, suffix = 'MAD' }) {
  return (
    <div className="input-suffix">
      <input
        className="input"
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <span className="suffix">{suffix}</span>
    </div>
  );
}

export default function Search() {
  const { t } = useI18n();

  // Filters
  const [location, setLocation]   = useState('Anywhere');
  const [minPrice, setMinPrice]   = useState('');
  const [maxPrice, setMaxPrice]   = useState('');
  const [category, setCategory]   = useState('Any');
  const [chauffeur, setChauffeur] = useState('Any'); // Any | Included | Not included
  const [delivery, setDelivery] = useState('');



  // Results
  const [cars, setCars]           = useState([]);
  const [loading, setLoading]     = useState(false);

  async function run() {
    setLoading(true);
    try {
      // Build params ONLY with set filters (avoid category=null, etc.)
      const params = {};
      if (location && location !== 'Anywhere') params.location = location;
      if (minPrice !== '') params.minPrice = Number(minPrice);
      if (maxPrice !== '') params.maxPrice = Number(maxPrice);
      if (category && category !== 'Any') params.category = category;
      if (['yes','no','on_demand'].includes(chauffeur))
  params.chauffeur = chauffeur;


      const res = await searchCars(params);
      setCars(res || []); // server returns array
    } catch (e) {
      console.error('Search error:', e);
      setCars([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { run(); }, []); // initial load

  return (
    <div className="container" style={{ paddingBottom: '120px' }}>
      <div className="card">
        <h1 className="h2">{t('search.title')}</h1>

        {/* Filters */}
        <div className="grid grid-5 gap-sm mt-md">
          <div>
            <label className="label">{t('filter.location')}</label>
            <select className="input" value={location} onChange={e => setLocation(e.target.value)}>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="label">{t('filter.min_per_day')}</label>
            <InputWithSuffix
              value={minPrice}
              onChange={setMinPrice}
              placeholder="0"
              suffix="MAD"
            />
          </div>

          <div>
            <label className="label">{t('filter.max_per_day')}</label>
            <InputWithSuffix
              value={maxPrice}
              onChange={setMaxPrice}
              placeholder="1000"
              suffix="MAD"
            />
          </div>

          <div>
            <label className="label">{t('filter.category')}</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
  <label className="label">Livraison</label>
  <select
    className="input"
    value={delivery}
    onChange={(e) => setDelivery(e.target.value)}
  >
    <option value="">Any</option>
    <option value="airport">Aéroport</option>
    <option value="none">Pas de livraison</option>
    <option value="custom">Personnalisée</option>
  </select>
</div>


        <div>
  <label className="label">Chauffeur</label>
 <select value={chauffeur} onChange={e => setChauffeur(e.target.value)}>
  <option value="">Any</option>
  <option value="yes">Included</option>
  <option value="no">Not included</option>
  <option value="on_demand">On demand</option>
</select>

</div>


        <button className="btn btn-primary mt-md" onClick={run}>
          {t('btn.search')}
        </button>
      </div>

      {/* Results */}
     <div
  className="car-grid mt-lg"
  style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
    justifyItems: 'center',     // center items in each grid cell
    alignItems: 'start',        // prevent row stretching
    marginBottom: '160px',      // guaranteed space above footer
  }}
>



        {loading && <div className="card">Loading…</div>}
        {!loading && cars.length === 0 && <div className="card">{t('misc.no_cars')}</div>}

        {!loading && cars.map(c => (
          <div className="car" key={c.id}>
            {c.image_url && <img src={c.image_url} alt={c.title} />}

            <div className="body">
              <h3 className="h3">{c.title}</h3>
              <div className="muted">
                {c.daily_price} MAD {t('car.price_per_day')}
              </div>
             <div className="muted mt-xxs">
  {c.agency_name ? <strong>{c.agency_name}</strong> : (c.location || '—')}
  {c.category ? ` — ${c.category}` : ''}
  {c.transmission ? ` — ${c.transmission}` : ''}
  {c.fuel_type ? ` — ${c.fuel_type}` : ''}
</div>

              {(c.agency_cities || c.agency_location || c.location) && (
            <div className="muted" style={{ marginTop: 4 }}>
    {/* prefer the multi-city field if present, else fall back */}
    {(c.agency_cities && c.agency_cities
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .join(', '))
     || c.agency_location
     || c.location}
  </div>
)}


              <Link className="btn btn-ghost mt-sm" to={`/car/${c.id}`}>
                {t('btn.view')}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
