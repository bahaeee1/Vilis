// client/src/pages/MyCars.jsx
import React, { useEffect, useState } from 'react';
import { getMyCars, deleteCar, updateCar } from '../api';

export default function MyCars() {
  const [cars, setCars] = useState([]);
  const [msg, setMsg] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyCars();
        setCars(res.cars || []);
      } catch (err) {
        setMsg(err?.error || 'Erreur de chargement');
      }
    })();
  }, []);

  async function handleDelete(id) {
    if (!window.confirm('Supprimer ce véhicule ?')) return;
    try {
      await deleteCar(id);
      setCars(cars.filter((c) => c.id !== id));
    } catch (err) {
      setMsg(err?.error || 'Erreur de suppression');
    }
  }

  async function handleSave(id) {
    try {
      await updateCar(id, { daily_price: Number(newPrice) });
      setCars((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, daily_price: Number(newPrice) } : c
        )
      );
      setEditingId(null);
      setMsg('Prix mis à jour ✅');
    } catch (err) {
      setMsg(err?.error || 'Erreur de mise à jour');
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
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#fff',
                      marginBottom: '8px',
                      textTransform: 'capitalize',
                    }}
                  >
                    {car.title}
                  </h3>
                  <div
                    style={{
                      fontSize: '15px',
                      color: '#93c5fd',
                      marginBottom: '6px',
                    }}
                  >
                    {car.daily_price} MAD / jour
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      color: '#ccc',
                      textTransform: 'capitalize',
                      marginBottom: '16px',
                    }}
                  >
                    {car.category}
                  </div>
                </div>

                {editingId === car.id ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="number"
                      className="input"
                      value={newPrice}
                      placeholder="Nouveau prix"
                      onChange={(e) => setNewPrice(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        color: '#fff',
                      }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={() => handleSave(car.id)}
                    >
                      Enregistrer
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setEditingId(car.id);
                        setNewPrice(car.daily_price);
                      }}
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
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
