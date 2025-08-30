import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerAgency, setToken } from '../api.js';

export default function AgencyRegister() {
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
      setToken(res.token);         // auto-login
      nav('/agency/add-car');      // go to add car
    } catch (e) {
      const message = e?.error?.message || e?.error || e?.message || JSON.stringify(e);
      setErr(message);
    }
  };

  return (
    <div className="card">
      <h2>Agency Register</h2>
      <div className="row">
        <div className="col-6"><label>Name</label><input value={name} onChange={e=>setName(e.target.value)} /></div>
        <div className="col-6"><label>Location</label><input value={location} onChange={e=>setLocation(e.target.value)} /></div>
      </div>
      <div className="row">
        <div className="col-6"><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} /></div>
        <div className="col-6"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
      </div>
      <div className="row">
        <div className="col-6"><label>Phone</label><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+212..." /></div>
      </div>
      <div style={{marginTop:12}}><button className="btn" onClick={onSubmit}>Create account</button></div>
      {err && <div className="error" style={{marginTop:8}}>{String(err)}</div>}
    </div>
  );
}
