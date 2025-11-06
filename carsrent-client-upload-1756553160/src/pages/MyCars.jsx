// client/src/pages/MyCars.jsx
import React, { useEffect, useState } from 'react';
import { getMyCars, deleteCar } from '../api';
import { useNavigate } from 'react-router-dom';

export default function MyCars() {
  const [cars, setCars] = useState([]);
  const [msg, setMsg] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyCars();
        // ✅ Some backends return array directly instead of { cars: [] }
        setCars(res.cars || res || []);
      } catch (err) {
        setMsg(err?.error || 'Erreur de chargement');
      }
    })();
  }, []);

  async function handleDelete(id) {
    if (!window.confirm('Supprimer ce véhicule ?')) return;
    try {
      await deleteCar(id);
      setCars((prev) => prev.filter((c) => c.id !== id));
      setMsg('Véhicule supprimé ✅');
    } catch (err) {
      setMsg(err?.error || 'Erreur de suppression');
    }
  }

  return (
    <div className="container">
      <div
        className="card"
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
          padding: '32px',
          borderRadius: '16px',
        }}
      >
        <h1 className="h2" style={{ marginBottom: 24 }}>
          Mes véhicules
        </h1>

        {msg && (
          <div
            style={{
              background: 'rgba(96,165,250,0.15)',
              padding: '10px 16px',
              borderRadius: 8,
              marginBottom: 16,
              color: '#93c5fd',
              fontWeight: 500,
            }}
          >
            {msg}
          </div>
        )}

        {cars.length === 0 ? (
          <div className="muted">Aucun véhicule ajouté.</div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
            }}
          >
            {cars.map((car) => (
              <div
                key={car.id}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '20px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  {car.image_url && (
                    <img
                      src={car.image_url}
                      alt={car.title}
                      style={{
                        width: '100%',
                        borderRadius: '12px',
                        marginBottom: '12px',
                        objectFit: 'cover',
                        height: '180px',
                      }}
                    />
                  )}

                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#fff',
                      marginBottom: '8px',
                      textTransform: 'capitalize',
                    }}
                  >
                    {car.title || '—'}
                  </h3>
                  <div
                    style={{
                      fontSize: '15px',
                      color: '#93c5fd',
                      marginBottom: '6px',
                    }}
                  >
                    {car.daily_price ? `${car.daily_price} MAD / jour` : '—'}
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      color: '#ccc',
                      textTransform: 'capitalize',
                      marginBottom: '16px',
                    }}
                  >
                    {car.category || '—'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
  <button
    className="btn btn-primary"
    onClick={() => nav(`/agency/cars/${car.id}/edit`)}
  >
    Modifier
  </button>
  <button
    className="btn btn-danger"
    onClick={() => handleDelete(car.id)}
  >
    Supprimer
  </button>
</div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
