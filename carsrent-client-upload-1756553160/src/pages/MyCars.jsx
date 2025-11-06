// client/src/pages/MyCars.jsx
import { useEffect, useState } from 'react';
import { getMyCars, deleteCar, updateCar } from '../api';

export default function MyCars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [editRow, setEditRow] = useState(null); // car id being edited
  const [form, setForm] = useState({}); // partial patch

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const list = await getMyCars();
        setCars(list);
      } catch (e) {
        setMsg(e?.error || 'Erreur');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const startEdit = (car) => {
    setEditRow(car.id);
    setForm({
      title: car.title,
      daily_price: car.daily_price,
      chauffeur_option: car.chauffeur_option,
      delivery: car.delivery || '',
      deposit: car.deposit ?? '',
      options: Array.isArray(car.options) ? car.options.join(', ') : '',
    });
  };

  const cancelEdit = () => { setEditRow(null); setForm({}); };

  const saveEdit = async (id) => {
    try {
      setMsg('');
      const patch = { ...form };
      // coerce numbers cleanly
      if (patch.daily_price !== undefined) patch.daily_price = Number(patch.daily_price);
      if (patch.deposit === '') patch.deposit = null; else if (patch.deposit != null) patch.deposit = Number(patch.deposit);
      const saved = await updateCar(id, patch);
      setCars((prev) => prev.map(c => c.id === id ? saved : c));
      cancelEdit();
    } catch (e) {
      setMsg(e?.error || 'Erreur sauvegarde');
    }
  };

  const removeCar = async (id) => {
    if (!confirm('Supprimer ce véhicule ?')) return;
    try {
      await deleteCar(id);
      setCars(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      setMsg(e?.error || 'Erreur suppression');
    }
  };

  if (loading) return <div className="container"><div className="card">Chargement…</div></div>;

  return (
    <div className="container">
      <div className="card">
        <h1 className="h2">Mes véhicules</h1>
        {msg && <div className="alert mt-xxs">{msg}</div>}
        {cars.length === 0 && <div className="muted">Aucun véhicule pour l’instant.</div>}

        <div className="mt-sm" style={{ display:'grid', gap:12 }}>
          {cars.map(car => (
            <div key={car.id} className="card" style={{ padding:12 }}>
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                {car.image_url && <img src={car.image_url} alt="" style={{ width:120, height:80, objectFit:'cover', borderRadius:8 }} />}
                <div style={{ flex:1 }}>
                  <div className="h3" style={{ margin:0 }}>{car.title}</div>
                  <div className="muted">{car.daily_price} MAD/jour · {car.category}</div>
                </div>
                {editRow !== car.id ? (
                  <>
                    <button className="btn" onClick={() => startEdit(car)}>Modifier</button>
                    <button className="btn btn-ghost" onClick={() => removeCar(car.id)}>Supprimer</button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-primary" onClick={() => saveEdit(car.id)}>Enregistrer</button>
                    <button className="btn" onClick={cancelEdit}>Annuler</button>
                  </>
                )}
              </div>

              {editRow === car.id && (
                <div className="mt-sm" style={{ display:'grid', gap:8 }}>
                  <div className="grid grid-2 gap-sm">
                    <div>
                      <label className="label">Titre</label>
                      <input className="input" value={form.title||''} onChange={e=>setForm(f=>({...f, title:e.target.value}))}/>
                    </div>
                    <div>
                      <label className="label">Prix / jour (MAD)</label>
                      <input className="input" type="number" min={1} value={form.daily_price||''} onChange={e=>setForm(f=>({...f, daily_price:e.target.value}))}/>
                    </div>
                  </div>

                  <div className="grid grid-3 gap-sm">
                    <div>
                      <label className="label">Chauffeur</label>
                      <select className="input" value={form.chauffeur_option||'no'} onChange={e=>setForm(f=>({...f, chauffeur_option:e.target.value}))}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                        <option value="on_demand">On demand</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Livraison</label>
                      <input className="input" value={form.delivery||''} onChange={e=>setForm(f=>({...f, delivery:e.target.value}))}/>
                    </div>
                    <div>
                      <label className="label">Dépôt (MAD)</label>
                      <input className="input" type="number" min={0} value={form.deposit===null?'':form.deposit} onChange={e=>setForm(f=>({...f, deposit:e.target.value}))}/>
                    </div>
                  </div>

                  <div>
                    <label className="label">Options (séparées par des virgules)</label>
                    <input className="input" value={form.options||''} onChange={e=>setForm(f=>({...f, options:e.target.value}))} placeholder="GPS, Siège bébé, 2e conducteur"/>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
