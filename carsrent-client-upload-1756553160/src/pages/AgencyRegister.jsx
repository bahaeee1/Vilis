import { useState } from 'react';
import { registerAgency, setToken } from '../api';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';

const CITIES = [
  'Casablanca','Rabat','Marrakesh','Fes','Tangier','Agadir','Oujda','Kenitra',
  'Tetouan','Safi','Mohammedia','El Jadida','Nador','Beni Mellal','Meknes',
  'Laayoune','Khouribga','Ksar El Kebir','Errachidia','Ouarzazate'
];

export default function AgencyRegister() {
  const { t } = useI18n();
  const nav = useNavigate();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const res = await registerAgency({ name, location, email, phone, password });
      setToken(res.token);
      nav('/add'); // go add first car
    } catch (e2) {
      setErr(e2?.error || 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>{t('areg.title')}</h2>

      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <input
            type="text"
            placeholder={t('areg.name')}
            value={name}
            onChange={(e)=>setName(e.target.value)}
          />
          <select value={location} onChange={(e)=>setLocation(e.target.value)}>
            <option value="">{t('select.city')}</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <input
            type="email"
            placeholder={t('areg.email')}
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder={t('areg.password')}
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
          />
        </div>

        <input
          type="tel"
          placeholder={t('areg.phone')}
          value={phone}
          onChange={(e)=>setPhone(e.target.value)}
        />

        {err && <div className="error">{String(err)}</div>}

        <button className="btn" disabled={busy}>
          {t('areg.create')}
        </button>
      </form>
    </div>
  );
}
