// client/src/pages/Bookings.jsx
import { useEffect, useState } from 'react';
import { getMyBookings, updateBookingStatus, deleteBooking } from '../api';
import { useI18n } from '../i18n.jsx';

function StatusPill({ status }) {
  const color =
    status === 'approved' ? '#1cc77e' :
    status === 'declined' ? '#e35b66' :
    '#8ba3b6';
  const bg =
    status === 'approved' ? 'rgba(28,199,126,.12)' :
    status === 'declined' ? 'rgba(227,91,102,.12)' :
    'rgba(139,163,182,.15)';
  return (
    <span style={{
      padding:'4px 10px', borderRadius:999, fontWeight:700,
      color, background:bg, border:`1px solid ${color}22`
    }}>
      {status}
    </span>
  );
}

export default function Bookings(){
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState(0);
  const [err, setErr] = useState('');

  const load = async () => {
    setErr('');
    try { setItems(await getMyBookings()); }
    catch(e){ setErr(e?.error || 'Error'); }
  };
  useEffect(() => { load(); }, []);

  const doSet = async (id, status) => {
    setBusyId(id);
    try {
      await updateBookingStatus(id, status);
      await load();
    } catch(e) {
      setErr(e?.error || 'Error');
    } finally {
      setBusyId(0);
    }
  };

  const doDelete = async (id) => {
    if (!confirm('Delete this booking?')) return;
    setBusyId(id);
    try {
      await deleteBooking(id);
      setItems(items => items.filter(x => x.id !== id));
    } catch(e) {
      setErr(e?.error || 'Error');
    } finally {
      setBusyId(0);
    }
  };

  return (
    <>
      <div className="card">
        <h2 style={{margin:0}}>{t('nav.bookings')}</h2>
        <p className="muted" style={{margin:'6px 0 0'}}>
          {t('bookings.help') || 'Approve, decline, or delete booking requests.'}
        </p>
        {err && <div className="error" style={{marginTop:10}}>{String(err)}</div>}
      </div>

      {items.map(b => (
        <div key={b.id} className="card">
          <div style={{
            display:'flex',
            gap:16,
            alignItems:'stretch',
            flexWrap:'wrap'
          }}>
            {/* Car image (private agency view) */}
            {b.car_image_url && (
              <img
                src={b.car_image_url}
                alt={b.car_title || 'Car'}
                style={{
                  width: 180,
                  height: 110,
                  objectFit: 'cover',
                  borderRadius: 12,
                  flex: '0 0 auto',
                  boxShadow: '0 6px 18px rgba(0,0,0,.25)'
                }}
                loading="lazy"
              />
            )}

            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
                <strong style={{fontSize:18}}>{b.car_title || 'Véhicule'}</strong>
                <StatusPill status={b.status || 'pending'} />
              </div>

              {/* Dates, phone, etc. */}
              <div className="muted" style={{marginTop:6}}>
                {b.start_date ? `${b.start_date} → ${b.end_date || ''}` : ''}
                {b.daily_price ? ` · ${b.daily_price} MAD/day` : ''}
                {` · ${t('tel') || 'Tel'}: ${b.customer_phone || b.phone || '-'}`}
                {b.customer_email ? ` · ${b.customer_email}` : ''}
              </div>

              {/* License plate (private) */}
              {b.car_plate && (
                <div style={{marginTop:8}}>
                  <span style={{
                    display:'inline-block',
                    padding:'4px 10px',
                    borderRadius:999,
                    border:'1px solid rgba(255,255,255,.25)',
                    background:'rgba(255,255,255,.08)',
                    fontWeight:700
                  }}>
                    Plaque: {b.car_plate}
                  </span>
                </div>
              )}

              {/* Optional message */}
              {b.message && <div style={{marginTop:8}}>"{b.message}"</div>}

              {/* Actions */}
              <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
                <button className="btn" disabled={busyId===b.id} onClick={() => doSet(b.id,'approved')}>
                  {t('btn.approve') || 'Approve'}
                </button>
                <button className="btn secondary" disabled={busyId===b.id} onClick={() => doSet(b.id,'declined')}>
                  {t('btn.decline') || 'Decline'}
                </button>
                <button
                  className="btn secondary"
                  style={{borderColor:'#e35b66',color:'#ffb3ba'}}
                  disabled={busyId===b.id}
                  onClick={() => doDelete(b.id)}
                >
                  {t('btn.delete') || 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {items.length === 0 && !err && (
        <div className="muted">No bookings yet.</div>
      )}
    </>
  );
}
