
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

async function throwNiceError(res){ const txt = await res.text(); try{ throw JSON.parse(txt); } catch{ throw { error: txt || `${res.status} ${res.statusText}` }; } }

export async function searchCars(params){ const q = new URLSearchParams(params); const r = await fetch(`${API_BASE}/api/cars?`+q.toString()); if(!r.ok) await throwNiceError(r); return r.json(); }
export async function getAvailability(id){ const r = await fetch(`${API_BASE}/api/cars/${id}/availability`); if(!r.ok) await throwNiceError(r); return r.json(); }
export async function getCar(id){ const r = await fetch(`${API_BASE}/api/cars/${id}`); if(!r.ok) await throwNiceError(r); return r.json(); }
export async function createBooking(payload){ const r = await fetch(`${API_BASE}/api/bookings`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)}); if(!r.ok) await throwNiceError(r); return r.json(); }
export async function registerAgency(payload){ const r = await fetch(`${API_BASE}/api/agency/register`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)}); if(!r.ok) await throwNiceError(r); return r.json(); }
