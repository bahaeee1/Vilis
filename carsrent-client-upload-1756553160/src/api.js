const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

// ---- auth helpers ----
export function setToken(token) { localStorage.setItem('token', token); window.dispatchEvent(new Event('tokenUpdated')); }
export function getToken() { return localStorage.getItem('token'); }
export function clearToken() { localStorage.removeItem('token'); window.dispatchEvent(new Event('tokenUpdated')); }
function authHeaders() { const t = getToken(); return t ? { Authorization: 'Bearer ' + t } : {}; }

async function throwNiceError(res) {
  const text = await res.text();
  try { throw JSON.parse(text); } catch { throw { error: text || `${res.status} ${res.statusText}` }; }
}

// ---- public endpoints ----
export async function searchCars(params) {
  const qs = new URLSearchParams(params);
  const r = await fetch(`${API_BASE}/api/cars?` + qs.toString());
  if (!r.ok) await throwNiceError(r);
  return r.json();
}
export async function getCar(id) {
  const r = await fetch(`${API_BASE}/api/cars/${id}`);
  if (!r.ok) await throwNiceError(r);
  return r.json();
}
export async function createBooking(payload) {
  // payload: { car_id, start_date, end_date, customer_name, customer_email, customer_phone? }
  const r = await fetch(`${API_BASE}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!r.ok) await throwNiceError(r);
  return r.json();
}

// ---- agency auth ----
export async function registerAgency(payload) {
  const r = await fetch(`${API_BASE}/api/agency/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!r.ok) await throwNiceError(r);
  return r.json();
}
export async function loginAgency(payload) {
  const r = await fetch(`${API_BASE}/api/agency/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!r.ok) await throwNiceError(r);
  return r.json();
}

// ---- agency actions (need token) ----
export async function addCar(payload) {
  const r = await fetch(`${API_BASE}/api/cars`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload)
  });
  if (!r.ok) await throwNiceError(r);
  return r.json();
}
export async function getMyBookings() {
  const r = await fetch(`${API_BASE}/api/agency/me/bookings`, {
    headers: { ...authHeaders() }
  });
  if (!r.ok) await throwNiceError(r);
  return r.json();
}

export { API_BASE };
