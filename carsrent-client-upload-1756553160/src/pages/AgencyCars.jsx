import React, { useEffect, useState } from 'react';
import { getMyCars } from '../api';
import { Link } from 'react-router-dom';

export default function AgencyCars() {
  const [cars, setCars] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const rows = await getMyCars();   // <-- uses /api/agency/me/cars
        setCars(rows || []);
      } catch (e) {
        const msg = (e && (e.error || e.message)) || 'Auth required';
        setError(msg);
      }
    })();
  }, []);

  return (
    <div className="container">
      <div className="card">
        <h1 className="h2">Mes véhicules</h1>
        {error && <div className="alert">{JSON.stringify({ error })}</div>}
        {!error && cars.length === 0 && <div className="muted">Aucun véhicule pour le moment.</div>}

        <div className="grid grid-3 gap-md mt-md">
          {cars.map(c => (
            <div className="car" key={c.id}>
              {c.image_url && <img src={c.image_url} alt={c.title} />}
              <div className="body">
                <h3 className="h3">{c.title}</h3>
                <div className="muted">{c.daily_price} MAD / jour · {c.category}</div>
                <Link className="btn btn-ghost mt-sm" to={`/car/${c.id}`}>Voir</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
