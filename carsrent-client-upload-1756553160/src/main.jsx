import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import './theme.css';

import { I18nProvider, useI18n } from './i18n.jsx';
import { getToken, clearToken, API_BASE } from './api';

import Search from './pages/Search.jsx';
import Car from './pages/Car.jsx';

import AgencyLogin from './pages/AgencyLogin.jsx';
import AddCar from './pages/AddCar.jsx';
import Bookings from './pages/Bookings.jsx';
import AgencyCars from './pages/AgencyCars.jsx';
import AgencyCatalog from './pages/AgencyCatalog.jsx';   // <-- NEW
import Account from './pages/Account.jsx';
import Terms from './pages/Terms.jsx';
import Privacy from './pages/Privacy.jsx';

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
    <header className="topnav">
      <div className="wrap">
        <div className="brand">Vilis</div>

        <nav className="nav-tabs">
          <NavLink end to="/" className={({isActive}) => isActive ? 'tab active' : 'tab'}>
            {t('nav.search')}
          </NavLink>

          {!token && (
  <>
    {/* Replace public/agency register with info page */}
    <NavLink to="/agency/onboarding" className={({isActive}) => isActive ? 'tab active' : 'tab'}>
      {t('nav.get_listed') /* e.g., “Get listed” */}
    </NavLink>
    <NavLink to="/agency/login" className={({isActive}) => isActive ? 'tab active' : 'tab'}>
      {t('nav.login')}
    </NavLink>
  </>
)}


          {token && (
            <>
              <NavLink to="/agency/cars" className={({isActive}) => isActive ? 'tab active' : 'tab'}>
                {t('nav.my_cars')}
              </NavLink>
              <NavLink to="/agency/add-car" className={({isActive}) => isActive ? 'tab active' : 'tab'}>
                {t('nav.add_car')}
              </NavLink>
              <NavLink to="/agency/bookings" className={({isActive}) => isActive ? 'tab active' : 'tab'}>
                {t('nav.bookings')}
              </NavLink>
              <NavLink to="/agency/account" className={({isActive}) => isActive ? 'tab active' : 'tab'}>
                {t('ui.account')}
              </NavLink>
              <button className="tab ghost" onClick={() => { clearToken(); nav('/'); }}>
                {t('nav.logout')}
              </button>
            </>
          )}
        </nav>

        <div className="nav-right">
          <select className="lang small" value={lang} onChange={e=>setLang(e.target.value)}>
            <option value="en">EN</option>
            <option value="fr">FR</option>
          </select>
        </div>
      </div>
    </header>
  );
}

function App() {
  useEffect(() => {
    fetch(`${API_BASE}/api/health`, { mode: 'cors' }).catch(() => {});
  }, []);
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/car/:id" element={<Car />} />
         
          <Route path="/agency/login" element={<AgencyLogin />} />
          <Route path="/agency/add-car" element={<AddCar />} />
          <Route path="/agency/bookings" element={<Bookings />} />
          <Route path="/agency/cars" element={<AgencyCars />} />
          <Route path="/agency/:id/cars" element={<AgencyCatalog />} /> {/* <-- NEW */}
          <Route path="/agency/account" element={<Account />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <NavLink to="/terms">Terms</NavLink>
        <NavLink to="/privacy">Privacy</NavLink>
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
