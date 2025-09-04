import { useState } from 'react';
import { addCar } from '../api';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';

const TRANSMISSIONS = [
  { value: 'manual', labelKey: 'values.transmission.manual' },
  { value: 'automatic', labelKey: 'values.transmission.automatic' },
];

const FUELS = [
  { value: 'diesel',   labelKey: 'values.fuel.diesel' },
  { value: 'petrol',   labelKey: 'values.fuel.petrol' },
  { value: 'hybrid',   labelKey: 'values.fuel.hybrid' },
  { value: 'electric', labelKey: 'values.fuel.electric' },
];

export default function AddCar() {
  const { t } = useI18n();
  const nav = useNavigate();

  const [title, setTitle] = useState('');
  const [daily_price, setDailyPrice] = useState('');
  const [image_url, setImageUrl] = useState('');
  const [year, setYear] = useState('');
  const [transmission, setTransmission] = useState('');
  const [seats, setSeats] = useState('');
  const [doors, setDoors] = useState('');
  const [trunk_liters, setTrunk] = useState('');
  const [fuel_type, setFuel] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await addCar({
        title,
        daily_price: Number(daily_price),
        image_url: image_url || null,
        year: year ? Number(year) : null,
        transmission: transmission || null,
        seats: seats ? Number(seats) : null,
        doors: doors ? Number(doors) : null,
        trunk_liters: trunk_liters ? Number(trunk_liters) : null,
        fuel_type: fuel_type || null
      });
      nav('/my-cars');
    } catch (e2) {
      setErr(e2?.error || 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>{t('addcar.title')}</h2>

      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <input
          type="text"
          placeholder={t('forms.title')}
          value={title}
          onChange={(e)=>setTitle(e.target.value)}
          required
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <input
            type="number"
            placeholder={t('forms.daily_price')}
            value={daily_price}
            onChange={(e)=>setDailyPrice(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder={t('forms.image_url')}
            value={image_url}
            onChange={(e)=>setImageUrl(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <input
            type="number"
            placeholder={t('forms.year')}
            value={year}
            onChange={(e)=>setYear(e.target.value)}
          />
          <select value={transmission} onChange={(e)=>setTransmission(e.target.value)}>
            <option value="">{t('forms.transmission')}</option>
            {TRANSMISSIONS.map(x => (
              <option key={x.value} value={x.value}>{t(x.labelKey)}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <input
            type="number"
            placeholder={t('forms.seats')}
            value={seats}
            onChange={(e)=>setSeats(e.target.value)}
          />
          <input
            type="number"
            placeholder={t('forms.doors')}
            value={doors}
            onChange={(e)=>setDoors(e.target.value)}
          />
          <input
            type="number"
            placeholder={t('forms.trunk_liters')}
            value={trunk_liters}
            onChange={(e)=>setTrunk(e.target.value)}
          />
        </div>

        <select value={fuel_type} onChange={(e)=>setFuel(e.target.value)}>
          <option value="">{t('forms.fuel_type')}</option>
          {FUELS.map(x => (
            <option key={x.value} value={x.value}>{t(x.labelKey)}</option>
          ))}
        </select>

        {err && <div className="error">{String(err)}</div>}

        <button className="btn" disabled={busy}>
          {t('addcar.create')}
        </button>
      </form>
    </div>
  );
}
