import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import './theme.css';

import { I18nProvider, useI18n } from './i18n.jsx';
import { getToken, clearToken, API_BASE } from './api';

import Search from './pages/Search.jsx';
import Car from './pages/Car.jsx';
import AgencyRegister from './pages/AgencyRegister.jsx';
import AgencyLogin from './pages/AgencyLogin.jsx';
import AddCar from './pages/AddCar.jsx';
import Bookings from './pages/Bookings.jsx';
import AgencyCars from './pages/AgencyCars.jsx';
import Account from './pages/Account.jsx';

function Navbar() {
  const { t, lang, setLang } = useI18n();
  const nav = useNavigate();
  const token = getToken();
  useEffect(() => {
    const onTok = () => nav(0);
    window.addEventListener('tokenUpdated', onTok);
    return () => window.removeEventListener('tokenUpdated', onTok);
  }, [nav]);
  return (
    <header>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
        <div className="brand">Vilis</div>
        <nav style={{gap:10}}>
          <div className="nav-links">
            <NavLink to="/">{t('nav.search')}</NavLink>
            {!token && <NavLink to="/agency/register">{t('nav.register')}</NavLink>}
            {!token && <NavLink to="/agency/login">{t('nav.login')}</NavLink>}
            {token && <NavLink to="/agency/cars">{t('nav.my_cars')}</NavLink>}
            {token && <NavLink to="/agency/add-car">{t('nav.add_car')}</NavLink>}
            {token && <NavLink to="/agency/bookings">{t('nav.bookings')}</NavLink>}
            {token && <NavLink to="/agency/account">{t('ui.account')}</NavLink>}
            {token && <a onClick={() => { clearToken(); nav('/'); }} style={{cursor:'pointer'}}>{t('nav.logout')}</a>}
          </div>
          <select className="lang" value={lang} onChange={e=>setLang(e.target.value)}>
            <option value="en">EN</option>
            <option value="fr">FR</option>
          </select>
        </nav>
      </div>
    </header>
  );
}

function App() {
  useEffect(() => { fetch(`${API_BASE}/api/health`, { mode:'cors' }).catch(()=>{}); }, []);
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/car/:id" element={<Car />} />
          <Route path="/agency/register" element={<AgencyRegister />} />
          <Route path="/agency/login" element={<AgencyLogin />} />
          <Route path="/agency/add-car" element={<AddCar />} />
          <Route path="/agency/bookings" element={<Bookings />} />
          <Route path="/agency/cars" element={<AgencyCars />} />
          <Route path="/agency/account" element={<Account />} />
        </Routes>
      </main>
      <footer style={{maxWidth:'1100px',margin:'40px auto',padding:'0 20px',color:'var(--muted)'}}>
        <a href="/terms" style={{color:'var(--muted)',marginRight:12}}>Terms</a>
        <a href="/privacy" style={{color:'var(--muted)'}}>Privacy</a>
      </footer>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </I18nProvider>
  </React.StrictMode>
);
