import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import Search from './pages/Search.jsx';
import Car from './pages/Car.jsx';
import AgencyRegister from './pages/AgencyRegister.jsx';
import AgencyLogin from './pages/AgencyLogin.jsx';
import AddCar from './pages/AddCar.jsx';
import AddAvailability from './pages/AddAvailability.jsx';
import Bookings from './pages/Bookings.jsx';
import { getToken, clearToken } from './api.js';

function Shell({ children }) {
  const [hasToken, setHasToken] = useState(!!getToken());
  const nav = useNavigate();

  useEffect(() => {
    const onUpdate = () => setHasToken(!!getToken());
    window.addEventListener('tokenUpdated', onUpdate);
    return () => window.removeEventListener('tokenUpdated', onUpdate);
  }, []);

  const logout = () => {
    clearToken();
    nav('/');
  };

  return (
    <>
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="brand">Car Rental (MVP)</div>
          <nav>
            <NavLink to="/">Search</NavLink>
            {' '}
            {hasToken ? (
              <>
                <NavLink to="/agency/add-car">Add Car</NavLink>{' '}
                <NavLink to="/agency/bookings">Bookings</NavLink>{' '}
                <button className="btn secondary" onClick={logout} style={{ marginLeft: 8 }}>Logout</button>
              </>
            ) : (
              <>
                <NavLink to="/agency/register">Register</NavLink>{' '}
                <NavLink to="/agency/login">Login</NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Shell>
      <Routes>
        <Route path="/" element={<Search />} />
        <Route path="/car/:id" element={<Car />} />
        <Route path="/agency/register" element={<AgencyRegister />} />
        <Route path="/agency/login" element={<AgencyLogin />} />
        <Route path="/agency/add-car" element={<AddCar />} />
        <Route path="/agency/availability/:id" element={<AddAvailability />} />
        <Route path="/agency/bookings" element={<Bookings />} />
      </Routes>
    </Shell>
  </BrowserRouter>
);
