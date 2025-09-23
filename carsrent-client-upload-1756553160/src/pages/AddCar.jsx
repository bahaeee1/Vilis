// client/src/pages/AddCar.jsx
import React, { useState } from 'react';
import { addCar } from '../api';
import { useI18n } from '../i18n';

const CATEGORIES = ['sedan','suv','hatchback','pickup','van','convertible','coupe','wagon','crossover'];
const FUEL = ['diesel','petrol','hybrid','electric'];
const THIS_YEAR = new Date().getFullYear();

export default function AddCar() {
  const { t } = useI18n();

  // Base form state (all required)
  const [title, setTitle] = useState('');
  const [daily_price, setPrice] = useState('');
  const [image_url, setImage] = useState('');
  const [year, setYear] = useState('');
  const [transmission, setTrans] = useState('manual');
  const [seats, setSeats] = useState('');
  const [doors, setDoors] = useState('');
  const [fuel_type, setFuel] = useState(FUEL[0]);
  const [category, setCategory] = useState('suv');

  // Tiered pricing editor
  // Each tier: { minDays: number, maxDays: number|null, price: number }
  const [tiers, setTiers] = useState([]);

  // UI
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const ensureNumber = (x) => {
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
  };

  // -------- Validation --------
  function validateBase() {
    if (!title.trim()) return t('forms.title') + ' required';
    if (!image_url.trim()) return t('forms.image_url') + ' required';
    if (!transmission) return t('forms.transmission') + ' required';
    if (!fuel_type) return t('forms.fuel_type') + ' required';
    if (!category) return t('forms.category') + ' required';

    const priceN = ensureNumber(daily_price);
    const yearN  = ensureNumber(year);
    const seatsN = ensureNumber(seats);
    const doorsN = ensureNumber(doors);

    if (priceN == null || priceN <= 0) return t('forms.daily_price') + ' must be > 0';
    if (yearN == null || yearN < 1990 || yearN > THIS_YEAR + 1) return t('forms.year') + ` must be 1990–${THIS_YEAR + 1}`;
    if (seatsN == null || seatsN < 1 || seatsN > 9) return t('forms.seats') + ' must be 1–9';
    if (doorsN == null || doorsN < 2 || doorsN > 6) return t('forms.doors') + ' must be 2–6';

    // URL check
    try {
      const u = new URL(image_url);
      if (!u.protocol.startsWith('http')) return 'Image URL must be http(s)';
    } catch {
      return 'Invalid Image URL';
    }

    return null;
  }

  function validateTiers(list) {
    if (!list || list.length === 0) return null; // tiers are optional
    // Normalize
    const cleaned = list.map(t => ({
      minDays: Number(t.minDays),
      maxDays: t.maxDays === '' || t.maxDays == null ? null : Number(t.maxDays),
      price: Number(t.price)
    }));
    // Basic checks
    for (const t of cleaned) {
      if (!Number.isFinite(t.minDays) || t.minDays < 1) return 'Tier minDays must be >= 1';
      if (t.maxDays != null && (!Number.isFinite(t.maxDays) || t.maxDays < 1)) return 'Tier maxDays must be a number or empty';
      if (t.maxDays != null && t.maxDays < t.minDays) return 'Tier maxDays must be >= minDays';
      if (!Number.isFinite(t.price) || t.price <= 0) return 'Tier price must be > 0';
    }
    // Sort & overlap check
    cleaned.sort((a,b) => a.minDays - b.minDays);
    for (let i = 1; i < cleaned.length; i++) {
      const prev = cleaned[i-1];
      const curr = cleaned[i];
      const prevEnd = prev.maxDays ?? Infinity;
      if (curr.minDays <= prevEnd) return 'Tiers overlap—adjust ranges';
    }
    return null;
  }

  // -------- Tiers editor helpers --------
  function addTier() {
    setTiers(prev => [...prev, { minDays: 1, maxDays: null, price: 0 }]);
  }
  function updateTier(i, field, val) {
    setTiers(prev => prev.map((t,idx) => idx===i ? { ...t, [field]: val } : t));
  }
  function removeTier(i) {
    setTiers(prev => prev.filter((_,idx) => idx!==i));
  }

  // -------- Submit --------
  async function onSubmit(e) {
    e.preventDefault();
    setMsg('');

    const baseErr = validateBase();
    if (baseErr) { setMsg(baseErr); return; }

    const tierErr = validateTiers(tiers);
    if (tierErr) { setMsg(tierErr); return; }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        daily_price: Number(daily_price),
        image_url: image_url.trim(),
        year: Number(year),
        transmission,
        seats: Number(seats),
        doors: Number(doors),
        fuel_type,
        category,
        price_tiers: tiers // server accepts array or JSON string
      };
      await addCar(payload);
      setMsg('Saved!');
      // reset
      setTitle(''); setPrice(''); setImage(''); setYear('');
      setTrans('manual'); setSeats(''); setDoors('');
      setFuel(FUEL[0]); setCategory('suv');
      setTiers([]);
    } catch (err) {
      const text = (err && (err.error || err.message)) || 'Error';
      setMsg(text);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="h2">{t('addcar.title')}</h1>

        <form className="form mt-md" onSubmit={onSubmit} noValidate>
          {/* Title */}
          <label className="label">{t('forms.title')}</label>
          <input
            className="input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            minLength={2}
            maxLength={120}
          />

          {/* Price + Image */}
          <div className="grid grid-2 gap-sm mt-sm">
            <div>
              <label className="label">{t('forms.daily_price')}</label>
              <input
                className="input"
                type="number"
                required
                min={1}
                step={1}
                value={daily_price}
                onChange={e => setPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="label">{t('forms.image_url')}</label>
              <input
                className="input"
                type="url"
                required
                placeholder="https://..."
                value={image_url}
                onChange={e => setImage(e.target.value)}
              />
            </div>
          </div>

          {/* Year + Transmission */}
          <div className="grid grid-2 gap-sm mt-sm">
            <div>
              <label className="label">{t('forms.year')}</label>
              <input
                className="input"
                type="number"
                required
                min={1990}
                max={THIS_YEAR + 1}
                value={year}
                onChange={e => setYear(e.target.value)}
              />
            </div>
            <div>
              <label className="label">{t('forms.transmission')}</label>
              <select
                className="input"
                required
                value={transmission}
                onChange={e => setTrans(e.target.value)}
              >
                <option value="manual">{t('values.transmission.manual')}</option>
                <option value="automatic">{t('values.transmission.automatic')}</option>
              </select>
            </div>
          </div>

          {/* Seats + Doors + Fuel */}
          <div className="grid grid-3 gap-sm mt-sm">
            <div>
              <label className="label">{t('forms.seats')}</label>
              <input
                className="input"
                type="number"
                required
                min={1}
                max={9}
                value={seats}
                onChange={e => setSeats(e.target.value)}
              />
            </div>
            <div>
              <label className="label">{t('forms.doors')}</label>
              <input
                className="input"
                type="number"
                required
                min={2}
                max={6}
                value={doors}
                onChange={e => setDoors(e.target.value)}
              />
            </div>
            <div>
              <label className="label">{t('forms.fuel_type')}</label>
              <select
                className="input"
                required
                value={fuel_type}
                onChange={e => setFuel(e.target.value)}
              >
                {FUEL.map(f => <option key={f} value={f}>{t(`values.fuel.${f}`)}</option>)}
              </select>
            </div>
          </div>

          {/* Category */}
          <div className="mt-sm">
            <label className="label">{t('forms.category')}</label>
            <select
              className="input"
              required
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Tiered pricing editor */}
          <div className="mt-md">
            <h3 className="h3">Tiered pricing (optional)</h3>
            <p className="muted">
              Define reduced daily rates for longer rentals. Example: 1–1: 400 MAD/day, 2–6: 350 MAD/day, 7–∞: 300 MAD/day.
            </p>

            {tiers.map((t, i) => (
              <div className="grid grid-3 gap-sm mt-xxs" key={i}>
                <div>
                  <label className="label">Min days</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={t.minDays}
                    onChange={e => updateTier(i, 'minDays', Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="label">Max days (blank = no limit)</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={t.maxDays ?? ''}
                    onChange={e => updateTier(i, 'maxDays', e.target.value === '' ? null : Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="label">Price / day (MAD)</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={t.price}
                    onChange={e => updateTier(i, 'price', Number(e.target.value))}
                  />
                </div>
                <button type="button" className="btn mt-xxs" onClick={() => removeTier(i)}>Remove</button>
              </div>
            ))}

            <button type="button" className="btn btn-ghost mt-sm" onClick={addTier}>+ Add tier</button>
          </div>

          {/* Message */}
          {msg && <div className="mt-sm muted">{msg}</div>}

          {/* Submit */}
          <button className="btn btn-primary mt-md" type="submit" disabled={saving}>
            {saving ? 'Saving…' : t('addcar.create')}
          </button>
        </form>
      </div>
    </div>
  );
}
