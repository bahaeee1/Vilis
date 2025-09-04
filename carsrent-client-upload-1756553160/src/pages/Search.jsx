import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchCars } from '../api';
import { useI18n } from '../i18n.jsx';

const CITIES = [
  'Anywhere','Casablanca','Rabat','Marrakesh','Tangier','Agadir','Fes','Kenitra','Tetouan','Oujda',
  'Safi','El Jadida','Mohammedia','Beni Mellal','Nador','Laayoune','Dakhla','Essaouira','Meknes'
];

export default function Search() {
  const { t } = useI18n();
  const [location, setLocation] = useState('Anywhere');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [cars, setCars] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const run = async () => {
    setBusy(true); setErr('');
    try {
      const params = {};
      if (location && location !== 'Anywhere') params.location = location;
      if (min) params.minPrice = min;
      if (max) params.maxPrice = max;
      setCars(await searchCars(params));
    } catch (e) {
      setErr(e?.error || 'Error');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { run(); /* initial */ }, []);

  return (
    <>
      <div className="card">
        <h2 style={{marginTop:0}}>{t('search.title')}</h2>
        <div className="row">
          <div className="col-12">
            <label>{t('filter.location')}</label>
            <select value={location} onChange={e=>setLocation(e.target.value)}>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="col-6">
            <label>{t('filter.min_per_day')}</label>
            <input inputMode="numeric" placeholder="e.g. 200" value={min} onChange={e=>setMin(e.target.value)} />
          </div>
          <div className="col-6">
            <label>{t('filter.max_per_day')}</label>
            <input inputMode="numeric" placeholder="e.g. 500" value={max} onChange={e=>setMax(e.target.value)} />
          </div>

          <div className="col-12">
            <button className="btn" onClick={run} disabled={busy}>{t('btn.search')}</button>
          </div>
        </div>
      </div>

      {err && <div className="error">{String(err)}</div>}

      <div className="cards">
        {cars.map(c => (
          <div key={c.id} className="car">
            {c.image_url && <img src={c.image_url} alt={c.title} />}
            <div className="body">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',gap:8}}>
                <div>
                  <strong>{c.title}</strong>
                  <div className="muted" style={{marginTop:4}}>
                    {t('agency')}: <span style={{fontWeight:600}}>{c.agency_name || ''}</span>
                    {c.agency_phone ? <> · {t('tel')}: {c.agency_phone}</> : null}
                  </div>
                </div>
                <div style={{textAlign:'right',whiteSpace:'nowrap',fontWeight:800}}>
                  {c.daily_price} MAD<span className="muted">{t('car.price_per_day')}</span>
                </div>
              </div>

              <div className="muted" style={{marginTop:6}}>
                {(c.year ? `${c.year} · ` : '')}
                {(c.transmission ? `${c.transmission} · ` : '')}
                {(c.seats ? `${c.seats} seats · ` : '')}
                {(c.doors ? `${c.doors} doors · ` : '')}
                {(c.trunk_liters ? `${c.trunk_liters}L trunk · ` : '')}
                {(c.fuel_type || '').toLowerCase()}
              </div>

              <div style={{display:'flex',gap:8,marginTop:10}}>
                <Link className="btn" to={`/car/${c.id}`}>{t('btn.view')}</Link>
                {c.agency_id && (
                  <Link className="btn secondary" to={`/agency/${c.agency_id}/cars`}>
                    {t('btn.agency_catalog')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {(!busy && cars.length === 0) && (
        <div className="muted" style={{marginTop:8}}>No cars found.</div>
      )}
    </>
  );
}
