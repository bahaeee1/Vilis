import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAgencyCatalog } from '../api.js';

export default function AgencyCatalog() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try { setData(await getAgencyCatalog(id)); }
      catch (e) { setErr(e.error || 'Failed to load'); }
    })();
  }, [id]);

  if (err) return <div className="card">{String(err)}</div>;
  if (!data) return <div className="card">Loading…</div>;

  const { agency, cars } = data;

  return (
    <div className="card">
      <h2>{agency.name} — Catalog</h2>
      <p className="muted">{agency.location} · Tel: {agency.phone}</p>
      <div className="grid" style={{marginTop:16}}>
        {cars.map(c => (
          <div key={c.id} className="car">
            <img src={c.image_url || 'https://picsum.photos/seed/'+c.id+'/600/400'} alt={c.title} />
            <div className="body">
              <div style={{fontWeight:700}}>{c.title}</div>
              <div className="muted">{c.brand} {c.model} · {c.location}</div>
              <div><b>{c.daily_price}</b> / day</div>
              <button className="btn" style={{marginTop:8}} onClick={()=>nav('/car/'+c.id)}>View</button>
            </div>
          </div>
        ))}
        {cars.length === 0 && <div>This agency has no cars listed yet.</div>}
      </div>
    </div>
  );
}
