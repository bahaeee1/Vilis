import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAgency, setToken } from '../api.js';

export default function AgencyLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const nav = useNavigate();

  const onSubmit = async () => {
    setErr(null);
    try {
      const res = await loginAgency({ email, password });
      setToken(res.token);
      nav('/agency/add-car');
    } catch (e) {
      const message = e?.error?.message || e?.error || e?.message || JSON.stringify(e);
      setErr(message);
    }
  };

  return (
    <div className="card">
      <h2>Agency Login</h2>
      <div className="row">
        <div className="col-6"><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} /></div>
        <div className="col-6"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
      </div>
      <div style={{marginTop:12}}><button className="btn" onClick={onSubmit}>Login</button></div>
      {err && <div className="error" style={{marginTop:8}}>{String(err)}</div>}
    </div>
  );
}
