// client/src/pages/AgencyRegister.jsx
import React, { useState } from 'react';
import { registerAgency } from '../api.js';
import { useI18n } from '../i18n.jsx';

const CITIES = [
  'Casablanca','Rabat','Marrakech','Fès','Tanger','Agadir','Meknès','Oujda',
  'Tétouan','Safi','Kenitra','Salé','Nador','El Jadida','Khouribga','Beni Mellal'
];

export default function AgencyRegister() {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);

  function looksLikeEmail(v) {
    return /\S+@\S+\.\S+/.test(String(v));
  }

  async function submit(e) {
    e.preventDefault();
    setErr(''); setOk('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErr('Name, email and password are required.');
      return;
    }
    if (!looksLikeEmail(email)) {
      setErr('Invalid email.');
      return;
    }

    try {
      setLoading(true);
      const res = await registerAgency({ name: name.trim(), email: email.trim(), phone: phone.trim() || null, password, location });
      // Optional: store token here if you want to auto-login
      setOk('Account created.');
      setName(''); setEmail(''); setPhone(''); setPassword(''); setLocation('');
    } catch (e) {
      setErr(e?.error || 'Register failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-8">
      <div className="card">
        <h1 className="text-2xl font-semibold mb-4">{t('areg.title')}</h1>
        <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">{t('areg.name')}</label>
            <input className="input" value={name} onChange={e=>setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">{t('areg.location')}</label>
            <select className="input" value={location} onChange={e=>setLocation(e.target.value)}>
              <option value="">{t('select.city')}</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('areg.email') /* will say "Email" */}</label>
            <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">{t('areg.phone')}</label>
            <input className="input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+212…" />
          </div>
          <div>
            <label className="label">{t('areg.password')}</label>
            <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>

          {err ? <div className="md:col-span-2 text-destructive">{err}</div> : null}
          {ok  ? <div className="md:col-span-2 text-green-500">{ok}</div> : null}

          <div className="md:col-span-2">
            <button className="btn" disabled={loading}>
              {loading ? 'Creating…' : t('areg.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
