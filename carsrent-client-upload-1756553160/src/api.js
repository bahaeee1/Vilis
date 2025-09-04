const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

/* ---- auth helpers ---- */
export function setToken(token) { localStorage.setItem('token', token); window.dispatchEvent(new Event('tokenUpdated')); }
export function getToken() { return localStorage.getItem('token'); }
export function clearToken() { localStorage.removeItem('token'); window.dispatchEvent(new Event('tokenUpdated')); }
function authHeaders() { const t = getToken(); return t ? { Authorization: 'Bearer ' + t } : {}; }

async function throwNiceError(res) {
  const text = await res.text();
  try { throw JSON.parse(text); } catch { throw { error: text || `${res.status} ${res.statusText}` }; }
}

/* ---- public endpoints ---- */
export async function searchCars(params) {
  const qs = new URLSearchParams(params);
  const r = await fetch(`${API_BASE}/api/cars?` + qs.toString(), { mode: 'cors' });
  if (!r.ok) await throwNiceError(r);
  return r.json();
}
export async function getCar(id) {
  const r = await fetch(`${API_BASE}/api/cars/${id}`, { mode: 'cors' });
  if (!r.ok) await throwNiceError(r);
  return r.json();
}
export async function getAgencyCatalog(agencyId) {
  const r = await fetch(`${API_BASE}/api/agency/${agencyId}/cars`, { mode: 'cors' });
  if (!r.ok) await throwNiceError(r);
  return r.json(); // { agency, cars }
}
export async function createBooking(payload) {
  const r = await fetch(`${API_BASE}/api/bookings`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), mode: 'cors'
  });
  if (!r.ok) await throwNiceError(r);
  return r.json();
}

/* ---- agency auth ---- */
export async function registerAgency(payload) {
  const r = await fetch(`${API_BASE}/api/agency/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), mode: 'cors'
  });
  if (!r.ok) await throwNiceError(r);
  return r.json();
}
export async function loginAgency(payload) {
  const r = await fetch(`${API_BASE}/api/agency/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), mode: 'cors'
  });
  if (!r.ok) await throwNiceError(r);
  return r.json();
}

/* ---- agency actions (need token) ---- */
export async function addCar(payload) {
  const r = await fetch(`${API_BASE}/api/cars`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(payload), mode: 'cors'
  });
  if (!r.ok) await throwNiceError(r);
  return r.json();
}
export async function getMyBookings() {
  const r = await fetch(`${API_BASE}/api/agency/me/bookings`, { headers: { ...authHeaders() }, mode: 'cors' });
  if (!r.ok) await throwNiceError(r);
  return r.json();
}
export async function getMyCars() {
  const r = await fetch(`${API_BASE}/api/agency/me/cars`, { headers: { ...authHeaders() }, mode: 'cors' });
  if (!r.ok) await throwNiceError(r);
  return r.json();
}
export async function deleteCar(id) {
  const r = await fetch(`${API_BASE}/api/cars/${id}`, { method: 'DELETE', headers: { ...authHeaders() }, mode: 'cors' });
  if (!r.ok) await throwNiceError(r);
  return r.json();
}
export async function deleteMyAccount(payload) { // { password }
  const r = await fetch(`${API_BASE}/api/agency/me`, {
    method: 'DELETE', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(payload), mode: 'cors'
  });
  if (!r.ok) await throwNiceError(r);
  return r.json();
}

export { API_BASE };
