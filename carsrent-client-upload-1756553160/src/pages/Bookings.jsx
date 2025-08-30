import React, { useEffect, useState } from 'react';
import { getMyBookings, getToken } from '../api.js';

export default function Bookings() {
  if (!getToken()) return <div className="card">Please login first.</div>;

  const [rows, setRows] = useState([]);
  useEffect(() => { (async () => { try { setRows(await getMyBookings()); } catch {} })(); }, []);

  return (
    <div className="card">
      <h2>My Bookings</h2>
      <ul>
        {rows.map(b => (
          <li key={b.id}>
            <b>{b.car_title}</b> — {b.start_date} → {b.end_date} — <b>{b.total_price}</b> — {b.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
