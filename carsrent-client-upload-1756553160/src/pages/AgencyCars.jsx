import { useEffect, useState } from 'react';
import { getMyCars, deleteCar } from '../api';
import { useI18n } from '../i18n.jsx';

export default function AgencyCars() {
  const { t } = useI18n();
  const [cars, setCars] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    setErr('');
    try {
      const list = await getMyCars();
      setCars(list);
    } catch (e) {
      setErr(e?.error || 'Error');
    }
  };

  useEffect(() => { load(); }, []);

  const onDelete = async (id) => {
    if (!confirm(t('ui.confirm_delete_car'))) return;
    setBusy(true);
    try {
      await deleteCar(id);
      setCars(cars.filter(c => c.id !== id));
    } catch (e) {
      alert(e?.error || 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{marginTop:0}}>{t('nav.my_cars')}</h2>
      {err && <div className="error">{String(err)}</div>}
      <div className="grid" style={{marginTop:12}}>
        {cars.map(c => (
          <div key={c.id} className="car" style={{gridColumn:'span 6'}}>
            {c.image_url && <img src={c.image_url} alt={c.title} />}
            <div className="body">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <strong>{c.title}</strong>
                <button className="btn secondary" disabled={busy} onClick={()=>onDelete(c.id)}>
                  {t('ui.delete')}
                </button>
              </div>
              <div className="muted" style={{marginTop:6}}>
                {c.brand || ''} {c.model || ''} • {c.location} • {c.daily_price} MAD/{t('car.price_per_day').replace(' / day','').replace(' / jour','')}
              </div>
            </div>
          </div>
        ))}
        {cars.length === 0 && (
          <div className="muted" style={{padding:'8px 2px'}}>{t('ui.no_cars')}</div>
        )}
      </div>
    </div>
  );
}
