import React, { useEffect, useState } from 'react';
import { getMyBookings, getToken } from '../api.js';

export default function Bookings() {
  if (!getToken()) return <div className="card">Please login first.</div>;

  const [rows, setRows] = useState([]);
  useEffect(() => {
    (async () => { try { setRows(await getMyBookings()); } catch {} })();
  }, []);

  return (
    <div className="card">
      <h2>My Bookings</h2>
      <ul>
        {rows.map(b => (
          <li key={b.id} style={{marginBottom:8}}>
            <div><b>{b.car_title}</b> — {b.start_date} → {b.end_date} — <b>{b.total_price}</b> — {b.status}</div>
            <div>Customer: <b>{b.customer_name}</b> — Tel: <b>{b.customer_phone}</b>{b.customer_email ? <> — Email: {b.customer_email}</> : null}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
