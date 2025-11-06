// client/src/api.js
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:10000';

// ---- auth helpers ----
export function setToken(token) {
  localStorage.setItem('token', token);
  window.dispatchEvent(new Event('tokenUpdated'));
}
export function getToken() { return localStorage.getItem('token'); }
export function clearToken() {
  localStorage.removeItem('token');
  window.dispatchEvent(new Event('tokenUpdated'));
}

// Single source of truth for headers
function authHeaders(includeJson = true) {
  const token = localStorage.getItem('token');
  const h = includeJson ? { 'Content-Type': 'application/json' } : {};
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function throwNiceError(res) {
  const text = await res.text();
  try { throw JSON.parse(text); }
  catch { throw { error: text || `${res.status} ${res.statusText}` }; }
}

// ---- public endpoints ----
export async function searchCars(params = {}) {
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
export async function getAgencyCatalog(agencyId) {
  const r = await fetch(`${API_BASE}/api/agency/${agencyId}/cars`);
  if (!r.ok) await throwNiceError(r);
  return r.json(); // { agency, cars }
}
export async function createBooking(payload) {
  const r = await fetch(`${API_BASE}/api/bookings`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  if (!r.ok) await throwNiceError(r);
  return r.json();
}

// ---- agency auth ----
export async function registerAgency(payload) {
  const r = await fetch(`${API_BASE}/api/agency/register`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  if (!r.ok) await throwNiceError(r);
  return r.json();
}
export async function loginAgency(payload) {
  const r = await fetch(`${API_BASE}/api/agency/login`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  if (!r.ok) await throwNiceError(r);
  return r.json();
}

// ---- agency actions (need token) ----
export async function addCar(payload) {
  const r = await fetch(`${API_BASE}/api/cars`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  if (!r.ok) await throwNiceError(r);
  return r.json();
}

export async function getMyCars() {
  const r = await fetch(`${API_BASE}/api/agency/me/cars`, {
    headers: authHeaders(false),
  });
  if (!r.ok) await throwNiceError(r);
  return r.json();
}

export async function updateCar(id, patch) {
  const r = await fetch(`${API_BASE}/api/cars/${id}`, {
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify(patch),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw data;
  return data.car || data; // server returns { car }
}

export async function deleteCar(id) {
  const r = await fetch(`${API_BASE}/api/cars/${id}`, {
    method: 'DELETE',
    headers: authHeaders(false),
  });
  if (!r.ok) await throwNiceError(r);
  return r.json(); // { ok: true }
}

export async function getMyBookings() {
  const r = await fetch(`${API_BASE}/api/agency/me/bookings`, {
    headers: authHeaders(false),
  });
  if (!r.ok) await throwNiceError(r);
  return r.json();
}

export async function updateBookingStatus(id, status) {
  const r = await fetch(`${API_BASE}/api/agency/me/bookings/${id}`, {
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify({ status }),
  });
  if (!r.ok) await throwNiceError(r);
  return r.json();
}

export async function deleteBooking(id) {
  const r = await fetch(`${API_BASE}/api/agency/me/bookings/${id}`, {
    method: 'DELETE',
    headers: authHeaders(false),
  });
  if (!r.ok) await throwNiceError(r);
  return r.json(); // { ok: true }
}

// ✅ Delete my agency account
export async function deleteMyAccount() {
  const r = await fetch(`${API_BASE}/api/agency/me`, {
    method: 'DELETE',
    headers: authHeaders(false),
  });
  if (!r.ok) await throwNiceError(r);
  return r.json(); // { ok: true }
}

export { API_BASE };
