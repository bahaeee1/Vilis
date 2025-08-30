import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addCar, getToken } from '../api.js';
import { MOROCCAN_CITIES, FUEL_TYPES } from '../constants.js';

export default function AddCar() {
  if (!getToken()) return <div className="card">Please login first.</div>;

  const nav = useNavigate();
  const [form, setForm] = useState({
    title: '', brand: '', model: '', year: '',
    transmission: 'automatic',
    seats: '', doors: '', trunk_liters: '',
    fuel_type: '',              // now a dropdown
    options: '', daily_price: '',
    location: '',               // now a dropdown
    image_url: '', description: ''
  });
  const [err, setErr] = useState(null);
  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async () => {
    setErr(null);
    try {
      const payload = {
        ...form,
        year: form.year ? Number(form.year) : undefined,
        seats: form.seats ? Number(form.seats) : undefined,
        doors: form.doors ? Number(form.doors) : undefined,
        trunk_liters: form.trunk_liters ? Number(form.trunk_liters) : undefined,
        daily_price: Number(form.daily_price)
      };
      await addCar(payload);
      nav('/agency/bookings');
    } catch (e) {
      const message = e?.error?.message || e?.error || e?.message || JSON.stringify(e);
      setErr(message);
    }
  };

  return (
    <div className="card">
      <h2>Add Car</h2>
      <div className="row">
        <div className="col-6"><label>Title</label><input name="title" value={form.title} onChange={onChange} /></div>
        <div className="col-3"><label>Brand</label><input name="brand" value={form.brand} onChange={onChange} /></div>
        <div className="col-3"><label>Model</label><input name="model" value={form.model} onChange={onChange} /></div>

        <div className="col-3"><label>Year</label><input name="year" type="number" value={form.year} onChange={onChange} /></div>
        <div className="col-3">
          <label>Transmission</label>
          <select name="transmission" value={form.transmission} onChange={onChange}>
            <option value="automatic">automatic</option>
            <option value="manual">manual</option>
          </select>
        </div>
        <div className="col-3"><label>Seats</label><input name="seats" type="number" value={form.seats} onChange={onChange} /></div>
        <div className="col-3"><label>Doors</label><input name="doors" type="number" value={form.doors} onChange={onChange} /></div>

        <div className="col-3"><label>Trunk (L)</label><input name="trunk_liters" type="number" value={form.trunk_liters} onChange={onChange} /></div>

        <div className="col-3">
          <label>Fuel</label>
          <select name="fuel_type" value={form.fuel_type} onChange={onChange}>
            <option value="">Select fuel…</option>
            {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        <div className="col-6"><label>Options</label>
          <input name="options" value={form.options} onChange={onChange} placeholder="GPS, Bluetooth..." />
        </div>

        <div className="col-3"><label>Price/day</label>
          <input name="daily_price" type="number" value={form.daily_price} onChange={onChange} />
        </div>

        <div className="col-3">
          <label>Location</label>
          <select name="location" value={form.location} onChange={onChange}>
            <option value="">Select city…</option>
            {MOROCCAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="col-6"><label>Photo URL</label>
          <input name="image_url" value={form.image_url} onChange={onChange} placeholder="https://..." />
        </div>

        <div className="col-12"><label>Description</label>
          <textarea name="description" value={form.description} onChange={onChange} />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button className="btn" onClick={onSubmit}>Save car</button>
      </div>
      {err && <div className="error" style={{ marginTop: 8 }}>{String(err)}</div>}
    </div>
  );
}
