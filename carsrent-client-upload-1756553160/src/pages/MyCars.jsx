// client/src/pages/MyCars.jsx
import React, { useEffect, useState } from 'react';
import { getMyCars, deleteCar, updateCar } from '../api';

export default function MyCars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [message, setMessage] = useState('');

  async function refresh() {
    try {
      setLoading(true);
      const data = await getMyCars();
      setCars(data);
    } catch (err) {
      setMessage(err.error || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cette voiture ?')) return;
    try {
      await deleteCar(id);
      setCars(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert(err.error || 'Erreur lors de la suppression');
    }
  }

  function startEdit(car) {
    setEditingId(car.id);
    setEditFields({ ...car });
  }

  async function handleSave(id) {
    try {
      await updateCar(id, editFields);
      setEditingId(null);
      setMessage('Voiture mise à jour ✅');
      refresh();
    } catch (err) {
      setMessage(err.error || 'Erreur de mise à jour');
    }
  }

  if (loading) return <div className="container">Chargement…</div>;

  return (
    <div className="container">
      <div className="card">
        <h1 className="h2">Mes voitures</h1>
        {message && <p>{message}</p>}

        {cars.length === 0 && <p>Aucune voiture enregistrée.</p>}

        {cars.map(car => (
          <div
            key={car.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            {editingId === car.id ? (
              <>
                <input
                  value={editFields.title}
                  onChange={e => setEditFields(f => ({ ...f, title: e.target.value }))}
                  placeholder="Titre"
                />
                <input
                  value={editFields.daily_price}
                  type="number"
                  onChange={e => setEditFields(f => ({ ...f, daily_price: e.target.value }))}
                  placeholder="Prix"
                />
                <button onClick={() => handleSave(car.id)}>💾 Enregistrer</button>
                <button onClick={() => setEditingId(null)}>❌ Annuler</button>
              </>
            ) : (
              <>
                <h3>{car.title}</h3>
                <p>{car.daily_price} MAD / jour</p>
                <p>{car.category}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => startEdit(car)}>Modifier</button>
                  <button onClick={() => handleDelete(car.id)}>Supprimer</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
