import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';

import './theme.css';
import { I18nProvider, useI18n } from './i18n.js';

import Search from './pages/Search.jsx';
import Car from './pages/Car.jsx';
import AgencyRegister from './pages/AgencyRegister.jsx';
import AgencyLogin from './pages/AgencyLogin.jsx';
import AddCar from './pages/AddCar.jsx';
import Bookings from './pages/Bookings.jsx';
import AgencyCars from './pages/AgencyCars.jsx';
import AgencyCatalog from './pages/AgencyCatalog.jsx';
import { getToken, clearToken } from './api.js';
import Terms from './pages/Terms.jsx';
import Privacy from './pages/Privacy.jsx';

function LangSwitch() {
  const { lang, setLang } = useI18n();
  return (
    <select
      value={lang}
      onChange={(e)=>setLang(e.target.value)}
      style={{
        background: '#0f1420', color: 'var(--text)', border: '1px solid #2a3146',
        borderRadius: 10, padding: '8px 10px', marginLeft: 10
      }}
      aria-label="Language"
    >
      <option value="en">EN</option>
      <option value="fr">FR</option>
    </select>
  );
}

function Shell({ children }) {
  const [hasToken, setHasToken] = useState(!!getToken());
  const nav = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    const onUpdate = () => setHasToken(!!getToken());
    window.addEventListener('tokenUpdated', onUpdate);
    return () => window.removeEventListener('tokenUpdated', onUpdate);
  }, []);

  const logout = () => { clearToken(); nav('/'); };

  return (
    <>
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="brand">{t('brand')}</div>
          <nav>
            <NavLink to="/">{t('nav.search')}</NavLink>{' '}
            {hasToken ? (
              <>
                <NavLink to="/agency/my-cars">{t('nav.my_cars')}</NavLink>{' '}
                <NavLink to="/agency/add-car">{t('nav.add_car')}</NavLink>{' '}
                <NavLink to="/agency/bookings">{t('nav.bookings')}</NavLink>{' '}
                <button className="btn" onClick={logout}>{t('nav.logout')}</button>
              </>
            ) : (
              <>
                <NavLink to="/agency/register">{t('nav.register')}</NavLink>{' '}
                <NavLink to="/agency/login">{t('nav.login')}</NavLink>
              </>
            )}
            <LangSwitch />
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <I18nProvider>
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/car/:id" element={<Car />} />
          <Route path="/agency/register" element={<AgencyRegister />} />
          <Route path="/agency/login" element={<AgencyLogin />} />
          <Route path="/agency/add-car" element={<AddCar />} />
          <Route path="/agency/bookings" element={<Bookings />} />
          <Route path="/agency/my-cars" element={<AgencyCars />} />
          <Route path="/agency/:id" element={<AgencyCatalog />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  </I18nProvider>
);
<footer style={{maxWidth:'1100px',margin:'40px auto',padding:'0 20px',color:'var(--muted)'}}>
  <a href="/terms" style={{color:'var(--muted)',marginRight:12}}>Terms</a>
  <a href="/privacy" style={{color:'var(--muted)'}}>Privacy</a>
</footer>
