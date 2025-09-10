// client/src/pages/AddCar.jsx
import React, { useState } from 'react';
import { addCar } from '../api';
import { useI18n } from '../i18n';

const CATEGORIES = ['sedan','suv','hatchback','pickup','van','convertible','coupe','wagon','crossover'];

export default function AddCar() {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [daily_price, setPrice] = useState('');
  const [image_url, setImage] = useState('');
  const [year, setYear] = useState('');
  const [transmission, setTrans] = useState('manual');
  const [seats, setSeats] = useState('');
  const [doors, setDoors] = useState('');
  const [fuel_type, setFuel] = useState('diesel');
  const [category, setCategory] = useState('suv'); // NEW
  const [msg, setMsg] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setMsg('');
    try {
      await addCar({
        title,
        daily_price: Number(daily_price),
        image_url,
        year: year ? Number(year) : null,
        transmission,
        seats: seats ? Number(seats) : null,
        doors: doors ? Number(doors) : null,
        fuel_type,
        category, // NEW
      });
      setMsg('Saved!');
      setTitle(''); setPrice(''); setImage(''); setYear('');
      setTrans('manual'); setSeats(''); setDoors('');
      setFuel('diesel'); setCategory('suv');
    } catch (e) {
      setMsg(e?.error || 'Error');
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="h2">{t('addcar.title')}</h1>

        <form className="form mt-md" onSubmit={onSubmit}>
          <label className="label">{t('forms.title')}</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} required />

          <div className="grid grid-2 gap-sm mt-sm">
            <div>
              <label className="label">{t('forms.daily_price')}</label>
              <input className="input" type="number" value={daily_price} onChange={e => setPrice(e.target.value)} required />
            </div>
            <div>
              <label className="label">{t('forms.image_url')}</label>
              <input className="input" value={image_url} onChange={e => setImage(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div className="grid grid-2 gap-sm mt-sm">
            <div>
              <label className="label">{t('forms.year')}</label>
              <input className="input" type="number" value={year} onChange={e => setYear(e.target.value)} />
            </div>
            <div>
              <label className="label">{t('forms.transmission')}</label>
              <select className="input" value={transmission} onChange={e => setTrans(e.target.value)}>
                <option value="manual">{t('values.transmission.manual')}</option>
                <option value="automatic">{t('values.transmission.automatic')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-3 gap-sm mt-sm">
            <div>
              <label className="label">{t('forms.seats')}</label>
              <input className="input" type="number" value={seats} onChange={e => setSeats(e.target.value)} />
            </div>
            <div>
              <label className="label">{t('forms.doors')}</label>
              <input className="input" type="number" value={doors} onChange={e => setDoors(e.target.value)} />
            </div>
            <div>
              <label className="label">{t('forms.fuel_type')}</label>
              <select className="input" value={fuel_type} onChange={e => setFuel(e.target.value)}>
                <option value="diesel">{t('values.fuel.diesel')}</option>
                <option value="petrol">{t('values.fuel.petrol')}</option>
                <option value="hybrid">{t('values.fuel.hybrid')}</option>
                <option value="electric">{t('values.fuel.electric')}</option>
              </select>
            </div>
          </div>

          {/* NEW: Category (replaces trunk) */}
          <div className="mt-sm">
            <label className="label">{t('forms.category') || 'Category'}</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
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
