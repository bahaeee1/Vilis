import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { createAvailability, getAvailability, getToken } from '../api.js';

export default function AddAvailability() {
  if (!getToken()) return <div className="card">Please login first.</div>;

  const { id } = useParams();
  const [start_date, setStart] = useState('');
  const [end_date, setEnd] = useState('');
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);

  const load = async () => {
    try { setRows(await getAvailability(id)); } catch {}
  };
  useEffect(() => { load(); }, [id]);

  const add = async () => {
    setErr(null);
    try {
      await createAvailability(id, { start_date, end_date });
      setStart(''); setEnd('');
      load();
    } catch (e) {
      const m = e?.error?.message || e?.error || e?.message || JSON.stringify(e);
      setErr(m);
    }
  };

  return (
    <div className="card">
      <h2>Availability for car #{id}</h2>
      <div className="row">
        <div className="col-3"><label>Start</label><input type="date" value={start_date} onChange={e=>setStart(e.target.value)} /></div>
        <div className="col-3"><label>End</label><input type="date" value={end_date} onChange={e=>setEnd(e.target.value)} /></div>
      </div>
      <div style={{marginTop:12}}><button className="btn" onClick={add}>Add range</button></div>
      {err && <div className="error" style={{marginTop:8}}>{String(err)}</div>}

      <h3 style={{marginTop:16}}>Existing ranges</h3>
      <ul>{rows.map(r => <li key={r.id}>{r.start_date} → {r.end_date}</li>)}</ul>
    </div>
  );
}
