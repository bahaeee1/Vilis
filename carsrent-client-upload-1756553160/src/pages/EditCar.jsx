// client/src/pages/EditCar.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCar } from '../api';
import { updateCar } from '../api';

const CATEGORIES = ['sedan','suv','hatchback','pickup','van','convertible','coupe','wagon','crossover'];
const FUEL = ['diesel','petrol','hybrid','electric'];
const THIS_YEAR = new Date().getFullYear();

export default function EditCar() {
  const { id } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // form state
  const [title, setTitle] = useState('');
  const [daily_price, setPrice] = useState('');
  const [image_url, setImage] = useState('');
  const [year, setYear] = useState('');
  const [transmission, setTrans] = useState('manual');
  const [seats, setSeats] = useState('');
  const [doors, setDoors] = useState('');
  const [fuel_type, setFuel] = useState(FUEL[0]);
  const [category, setCategory] = useState('suv');

  const [mileage_limit, setMileageLimit] = useState('illimité');
  const [insurance, setInsurance] = useState('incluse');
  const [min_age, setMinAge] = useState(21);

  const [chauffeur_option, setChauffeur] = useState('no');
  const [delivery, setDelivery] = useState('');
  const [deposit, setDeposit] = useState('');

  const [optionsText, setOptionsText] = useState('');
  const [tiers, setTiers] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const car = await getCar(id);

        setTitle(car.title || '');
        setPrice(car.daily_price ?? '');
        setImage(car.image_url || '');
        setYear(car.year ?? '');
        setTrans(car.transmission || 'manual');
        setSeats(car.seats ?? '');
        setDoors(car.doors ?? '');
        setFuel(car.fuel_type || FUEL[0]);
        setCategory(car.category || 'suv');

        setMileageLimit(car.mileage_limit || 'illimité');
        setInsurance(car.insurance || 'incluse');
        setMinAge(car.min_age ?? 21);

        setChauffeur(car.chauffeur_option || 'no');
        setDelivery(car.delivery || '');
        setDeposit(car.deposit ?? '');

        // options -> CSV
        try {
          const opts = typeof car.options === 'string' ? JSON.parse(car.options) : (car.options || []);
          setOptionsText((opts || []).join(', '));
        } catch { setOptionsText(''); }

        // tiers array
        try {
          const t = typeof car.price_tiers === 'string' ? JSON.parse(car.price_tiers) : (car.price_tiers || []);
          setTiers(Array.isArray(t) ? t : []);
        } catch { setTiers([]); }

      } catch (e) {
        setMsg(e?.error || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function validate() {
    if (!title.trim()) return 'Titre requis';
    if (!image_url.trim()) return 'Image URL requise';
    if (!daily_price || Number(daily_price) <= 0) return 'Prix/jour invalide';
    return null;
  }

  function normalizeTiers(list) {
    if (!list || list.length === 0) return [];
    const cleaned = list.map(t => ({
      minDays: Number(t.minDays),
      maxDays: t.maxDays === '' || t.maxDays == null ? null : Number(t.maxDays),
      price: Number(t.price)
    }));
    cleaned.sort((a,b) => a.minDays - b.minDays);
    for (let i = 1; i < cleaned.length; i++) {
      const prevEnd = cleaned[i-1].maxDays ?? Infinity;
      if (cleaned[i].minDays <= prevEnd) throw new Error('Tiers se chevauchent');
    }
    return cleaned;
  }

  async function onSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) { setMsg(err); return; }

    const options =
      optionsText
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    let tiersClean = [];
    try { tiersClean = normalizeTiers(tiers); } catch (e) { setMsg(e.message); return; }

    try {
      await updateCar(id, {
        title: title.trim(),
        daily_price: Number(daily_price),
        image_url: image_url.trim(),
        year: Number(year),
        transmission,
        seats: Number(seats),
        doors: Number(doors),
        fuel_type,
        category,

        mileage_limit,
        insurance,
        min_age: Number(min_age),

        chauffeur_option,
        delivery: delivery?.trim() || null,
        deposit: deposit === '' ? null : Number(deposit),

        options,
        price_tiers: tiersClean
      });
      setMsg('Véhicule mis à jour ✅');
      setTimeout(() => nav('/me/cars'), 700);
    } catch (e2) {
      setMsg(e2?.error || 'Erreur de mise à jour');
    }
  }

  function updateTier(i, field, val) {
    setTiers(prev => prev.map((t, idx) => (idx === i ? { ...t, [field]: val } : t)));
  }

  if (loading) return <div className="container"><div className="card">Chargement…</div></div>;

  return (
    <div className="container">
      <div className="card" style={{ padding: 24 }}>
        <h1 className="h2">Modifier le véhicule</h1>

        {msg && (
          <div style={{ marginTop: 12, marginBottom: 12, color: '#93c5fd' }}>{msg}</div>
        )}

        <form className="form mt-md" onSubmit={onSubmit} noValidate>
          <label className="label">Titre</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />

          <div className="grid grid-2 gap-sm mt-sm">
            <div>
              <label className="label">Prix par jour (MAD)</label>
              <input className="input" type="number" value={daily_price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <label className="label">Image URL</label>
              <input className="input" value={image_url} onChange={(e) => setImage(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-2 gap-sm mt-sm">
            <div>
              <label className="label">Année</label>
              <input className="input" type="number" min={1990} max={THIS_YEAR + 1} value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            <div>
              <label className="label">Transmission</label>
              <select className="input" value={transmission} onChange={(e) => setTrans(e.target.value)}>
                <option value="manual">Manuelle</option>
                <option value="automatic">Automatique</option>
              </select>
            </div>
          </div>

          <div className="grid grid-3 gap-sm mt-sm">
            <div>
              <label className="label">Sièges</label>
              <input className="input" type="number" value={seats} onChange={(e) => setSeats(e.target.value)} />
            </div>
            <div>
              <label className="label">Portes</label>
              <input className="input" type="number" value={doors} onChange={(e) => setDoors(e.target.value)} />
            </div>
            <div>
              <label className="label">Carburant</label>
              <select className="input" value={fuel_type} onChange={(e) => setFuel(e.target.value)}>
                {FUEL.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-sm">
            <label className="label">Catégorie</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-3 gap-sm mt-sm">
            <div>
              <label className="label">Kilométrage</label>
              <select className="input" value={mileage_limit} onChange={(e) => setMileageLimit(e.target.value)}>
                <option value="illimité">Illimité</option>
                <option value="200 km/jour">Max 200 km/jour</option>
                <option value="150 km/jour">Max 150 km/jour</option>
                <option value="100 km/jour">Max 100 km/jour</option>
              </select>
            </div>
            <div>
              <label className="label">Assurance</label>
              <select className="input" value={insurance} onChange={(e) => setInsurance(e.target.value)}>
                <option value="incluse">Incluse</option>
                <option value="tous risques">Tous risques</option>
                <option value="de base">De base</option>
              </select>
            </div>
            <div>
              <label className="label">Âge minimum</label>
              <input className="input" type="number" min={18} max={30} value={min_age} onChange={(e) => setMinAge(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-3 gap-sm mt-sm">
            <div>
              <label className="label">Chauffeur</label>
              <select className="input" value={chauffeur_option} onChange={(e) => setChauffeur(e.target.value)}>
                <option value="no">Non</option>
                <option value="yes">Inclus</option>
                <option value="on_demand">Sur demande</option>
              </select>
            </div>
            <div>
  <label className="label">Livraison</label>
  <select
    className="input"
    value={delivery}
    onChange={(e) => setDelivery(e.target.value)}
  >
    <option value="none">Pas de livraison</option>
    <option value="airport">Aéroport</option>
    <option value="custom">Personnalisée</option>
  </select>
</div>

              <label className="label">Dépôt (MAD)</label>
              <input className="input" type="number" min={0} value={deposit} onChange={(e) => setDeposit(e.target.value)} />
            </div>
          </div>

          <div className="mt-sm">
            <label className="label">Options (séparées par des virgules)</label>
            <input className="input" value={optionsText} onChange={(e) => setOptionsText(e.target.value)} placeholder="GPS, Siège bébé, Bluetooth" />
          </div>

          <div className="mt-md">
            <h3 className="h3">Tarifs dégressifs (optionnel)</h3>
            {tiers.map((t,i) => (
              <div key={i} className="grid grid-3 gap-sm mt-xxs">
                <div>
                  <label className="label">Min jours</label>
                  <input className="input" type="number" value={t.minDays} onChange={e => updateTier(i,'minDays', Number(e.target.value))}/>
                </div>
                <div>
                  <label className="label">Max jours (vide = ∞)</label>
                  <input className="input" type="number" value={t.maxDays ?? ''} onChange={e => updateTier(i,'maxDays', e.target.value === '' ? null : Number(e.target.value))}/>
                </div>
                <div>
                  <label className="label">Prix/jour</label>
                  <input className="input" type="number" value={t.price} onChange={e => updateTier(i,'price', Number(e.target.value))}/>
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-ghost mt-sm" onClick={() => setTiers(prev => [...prev, { minDays: 1, maxDays: null, price: 0 }])}>+ Ajouter un palier</button>
          </div>

          <div className="mt-md" style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" type="submit">Enregistrer</button>
            <button className="btn btn-ghost" type="button" onClick={() => nav('/me/cars')}>Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
}
