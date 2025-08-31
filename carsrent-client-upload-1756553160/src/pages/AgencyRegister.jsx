import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerAgency, setToken } from '../api.js';
import { MOROCCAN_CITIES } from '../constants.js';
import { useI18n } from '../i18n.js';

export default function AgencyRegister() {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState(null);
  const nav = useNavigate();

  const onSubmit = async () => {
    setErr(null);
    try {
      const res = await registerAgency({ name, email, password, location, phone });
      setToken(res.token);
      nav('/agency/add-car');
    } catch (e) {
      const message = e?.error?.message || e?.error || e?.message || JSON.stringify(e);
      setErr(message);
    }
  };

  return (
    <div className="card">
      <h2>{t('areg.title')}</h2>
      <div className="row">
        <div className="col-6"><label>{t('areg.name')}</label><input value={name} onChange={e=>setName(e.target.value)} /></div>
        <div className="col-6">
          <label>{t('areg.location')}</label>
          <select value={location} onChange={e=>setLocation(e.target.value)}>
            <option value="">{t('select.city')}</option>
            {MOROCCAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="row">
        <div className="col-6"><label>{t('areg.email')}</label><input value={email} onChange={e=>setEmail(e.target.value)} /></div>
        <div className="col-6"><label>{t('areg.password')}</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
      </div>
      <div className="row">
        <div className="col-6"><label>{t('areg.phone')}</label><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+212..." /></div>
      </div>
      <div style={{marginTop:12}}><button className="btn" onClick={onSubmit}>{t('areg.create')}</button></div>
      {err && <div className="error" style={{marginTop:8}}>{String(err)}</div>}
    </div>
  );
}
