import React, { useEffect, useState } from 'react';
import { getMyCars, getToken } from '../api.js';
import { useNavigate } from 'react-router-dom';

export default function AgencyCars() {
  if (!getToken()) return <div className="card">Please login first.</div>;

  const [rows, setRows] = useState([]);
  const nav = useNavigate();

  useEffect(() => { (async () => { try { setRows(await getMyCars()); } catch {} })(); }, []);

  return (
    <div className="card">
      <h2>My Cars</h2>
      <div className="grid" style={{marginTop:16}}>
        {rows.map(c => (
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
        {rows.length === 0 && <div>No cars yet — add some in “Add Car”.</div>}
      </div>
    </div>
  );
}
