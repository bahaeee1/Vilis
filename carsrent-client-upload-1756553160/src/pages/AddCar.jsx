// client/src/pages/AddCar.jsx
import React, { useState } from 'react';
import { addCar } from '../api';
import { useI18n } from '../i18n';

const CATEGORIES = ['sedan','suv','hatchback','pickup','van','convertible','coupe','wagon','crossover'];
const FUEL = ['diesel','petrol','hybrid','electric'];
const THIS_YEAR = new Date().getFullYear();

export default function AddCar() {
  const { t } = useI18n();

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

  const [msg, setMsg] = useState('');

  function ensureNumber(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
  }

  function validate() {
    // Required string/selection fields
    if (!title.trim()) return t('forms.title') + ' required';
    if (!image_url.trim()) return t('forms.image_url') + ' required';
    if (!transmission) return t('forms.transmission') + ' required';
    if (!fuel_type) return t('forms.fuel_type') + ' required';
    if (!category) return t('forms.category') + ' required';

    // Numbers and bounds
    const priceN = ensureNumber(daily_price);
    const yearN  = ensureNumber(year);
    const seatsN = ensureNumber(seats);
    const doorsN = ensureNumber(doors);

    if (priceN == null || priceN <= 0) return t('forms.daily_price') + ' must be > 0';
    if (yearN == null || yearN < 1990 || yearN > THIS_YEAR + 1) return t('forms.year') + ` must be 1990–${THIS_YEAR + 1}`;
    if (seatsN == null || seatsN < 1 || seatsN > 9) return t('forms.seats') + ' must be 1–9';
    if (doorsN == null || doorsN < 2 || doorsN > 6) return t('forms.doors') + ' must be 2–6';

    // Simple URL check (let browser built-in validation also help)
    try {
      const u = new URL(image_url);
      if (!u.protocol.startsWith('http')) return 'Image URL must be http(s)';
    } catch {
      return 'Invalid Image URL';
    }
    return null;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg('');
    const err = validate();
    if (err) { setMsg(err); return; }

    try {
      const res = await addCar({
        title: title.trim(),
        daily_price: Number(daily_price),
        image_url: image_url.trim(),
        year: Number(year),
        transmission,
        seats: Number(seats),
        doors: Number(doors),
        fuel_type,
        category,
      });
      setMsg('Saved!');
      // Reset form
      setTitle(''); setPrice(''); setImage(''); setYear('');
      setTrans('manual'); setSeats(''); setDoors('');
      setFuel(FUEL[0]); setCategory('suv');
    } catch (e) {
      setMsg(e?.error || 'Error');
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="h2">{t('addcar.title')}</h1>

        <form className="form mt-md" onSubmit={onSubmit} noValidate>
          <label className="label">{t('forms.title')}</label>
          <input
            className="input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            minLength={2}
            maxLength={120}
          />

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

          {msg && <div className="mt-sm muted">{msg}</div>}

          <button className="btn btn-primary mt-md" type="submit">
            {t('addcar.create')}
          </button>
        </form>
      </div>
    </div>
  );
}
