import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAgencyCatalog } from '../api';
import { useI18n } from '../i18n.jsx';

export default function AgencyCatalog() {
  const { t } = useI18n();
  const { id } = useParams();
  const [agency, setAgency] = useState(null);
  const [cars, setCars] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      setBusy(true); setErr('');
      try {
        const data = await getAgencyCatalog(id);
        setAgency(data.agency);
        setCars(data.cars || []);
      } catch (e) {
        setErr(e?.error || 'Error');
      } finally {
        setBusy(false);
      }
    })();
  }, [id]);

  return (
    <>
      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h2 style={{margin:0}}>
            {agency ? agency.name : t('btn.agency_catalog')}
          </h2>
          <Link to="/" className="btn secondary">← {t('nav.search')}</Link>
        </div>

        {agency && (
          <div className="muted" style={{marginTop:8}}>
            {agency.location ? `${agency.location} · ` : ''}
            {t('tel')}: {agency.phone}
            {agency.email ? <> · {agency.email}</> : null}
          </div>
        )}

        {err && <div className="error" style={{marginTop:12}}>{String(err)}</div>}
      </div>

      <div className="cards">
        {cars.map(c => (
          <div key={c.id} className="car">
            {c.image_url && <img src={c.image_url} alt={c.title} />}
            <div className="body">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',gap:8}}>
                <strong>{c.title}</strong>
                <div style={{textAlign:'right',whiteSpace:'nowrap',fontWeight:800}}>
                  {c.daily_price} MAD<span className="muted"> {t('car.price_per_day')}</span>
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
              <div style={{marginTop:10}}>
                <Link className="btn" to={`/car/${c.id}`}>{t('btn.view')}</Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(!busy && cars.length === 0) && (
        <div className="muted" style={{marginTop:8}}>No cars yet.</div>
      )}
    </>
  );
}
