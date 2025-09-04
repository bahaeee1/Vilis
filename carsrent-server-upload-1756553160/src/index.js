// server/src/index.js
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const PORT = process.env.PORT || 10000;

// --- helpers ---
function signToken(agency) {
  return jwt.sign({ id: agency.id, name: agency.name }, JWT_SECRET, { expiresIn: '30d' });
}
function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer (.+)$/);
  if (!m) return res.status(401).json({ error: 'No token' });
  try {
    const payload = jwt.verify(m[1], JWT_SECRET);
    req.agencyId = payload.id;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// --- health ---
app.get('/api/health', (req,res) => res.json({ ok: true }));

// --- agency auth ---
app.post('/api/agency/register', (req, res) => {
  const { name, email, password, location, phone } = req.body || {};
  if (!name || !password) return res.status(400).json({ error: 'Missing name/password' });
  const hash = bcrypt.hashSync(String(password), 10);
  const info = db.prepare(
    `INSERT INTO agencies(name,email,password_hash,location,phone) VALUES(?,?,?,?,?)`
  ).run(name, email || null, hash, location || null, phone || null);
  const agency = db.prepare(`SELECT id,name,email,location,phone FROM agencies WHERE id=?`).get(info.lastInsertRowid);
  res.json({ token: signToken(agency), agency });
});

app.post('/api/agency/login', (req, res) => {
  const { email, password } = req.body || {};
  const ag = db.prepare(`SELECT * FROM agencies WHERE email=?`).get(email || '');
  if (!ag) return res.status(400).json({ error: 'Invalid email or password' });
  if (!bcrypt.compareSync(String(password || ''), ag.password_hash)) {
    return res.status(400).json({ error: 'Invalid email or password' });
  }
  res.json({ token: signToken(ag), agency: { id: ag.id, name: ag.name, email: ag.email, location: ag.location, phone: ag.phone } });
});

// --- cars (public search & get) ---
app.get('/api/cars', (req, res) => {
  const { location, minPrice, maxPrice } = req.query;
  const where = [];
  const params = {};
  if (location) { where.push(`ag.location = @location`); params.location = location; }
  if (minPrice) { where.push(`c.daily_price >= @minPrice`); params.minPrice = Number(minPrice); }
  if (maxPrice) { where.push(`c.daily_price <= @maxPrice`); params.maxPrice = Number(maxPrice); }

  const rows = db.prepare(`
    SELECT c.*, ag.name AS agency_name, ag.phone AS agency_phone, ag.id AS agency_id, ag.location
    FROM cars c
    JOIN agencies ag ON ag.id = c.agency_id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY c.created_at DESC
  `).all(params);
  res.json(rows);
});

app.get('/api/cars/:id', (req, res) => {
  const row = db.prepare(`
    SELECT c.*, ag.name AS agency_name, ag.phone AS agency_phone, ag.id AS agency_id, ag.location
    FROM cars c JOIN agencies ag ON ag.id=c.agency_id WHERE c.id=?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// --- public booking (always pending initially) ---
app.post('/api/bookings', (req, res) => {
  const { car_id, customer_name, customer_phone, customer_email, start_date, end_date, message } = req.body || {};
  if (!car_id || !customer_name || !customer_phone)
    return res.status(400).json({ error: 'Missing required fields' });

  const car = db.prepare(`SELECT id, agency_id FROM cars WHERE id=?`).get(car_id);
  if (!car) return res.status(400).json({ error: 'Invalid car' });

  const info = db.prepare(`
    INSERT INTO bookings(car_id, agency_id, customer_name, customer_phone, customer_email, start_date, end_date, message, status)
    VALUES(@car_id,@agency_id,@customer_name,@customer_phone,@customer_email,@start_date,@end_date,@message,'pending')
  `).run({
    car_id,
    agency_id: car.agency_id,
    customer_name,
    customer_phone,
    customer_email: customer_email || null,
    start_date: start_date || null,
    end_date: end_date || null,
    message: message || null
  });

  const row = db.prepare(`SELECT * FROM bookings WHERE id=?`).get(info.lastInsertRowid);
  res.json(row);
});

// --- agency protected: add car, my cars, my bookings, update/delete bookings ---
app.post('/api/cars', requireAuth, (req, res) => {
  const { title, daily_price, image_url, year, transmission, seats, doors, trunk_liters, fuel_type } = req.body || {};
  if (!title || !daily_price) return res.status(400).json({ error: 'Missing title/daily_price' });
  const info = db.prepare(`
    INSERT INTO cars(agency_id,title,daily_price,image_url,year,transmission,seats,doors,trunk_liters,fuel_type)
    VALUES(@agency_id,@title,@daily_price,@image_url,@year,@transmission,@seats,@doors,@trunk_liters,@fuel_type)
  `).run({
    agency_id: req.agencyId,
    title,
    daily_price,
    image_url: image_url || null,
    year: year || null,
    transmission: transmission || null,
    seats: seats || null,
    doors: doors || null,
    trunk_liters: trunk_liters || null,
    fuel_type: fuel_type || null
  });
  const row = db.prepare(`SELECT * FROM cars WHERE id=?`).get(info.lastInsertRowid);
  res.json(row);
});

app.get('/api/agency/me/cars', requireAuth, (req, res) => {
  const rows = db.prepare(`SELECT * FROM cars WHERE agency_id=? ORDER BY created_at DESC`).all(req.agencyId);
  res.json(rows);
});

app.get('/api/agency/me/bookings', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT b.*, c.title AS car_title, c.daily_price, c.image_url
    FROM bookings b
    JOIN cars c ON c.id = b.car_id
    WHERE b.agency_id=?
    ORDER BY b.created_at DESC
  `).all(req.agencyId);
  res.json(rows);
});

// NEW: update booking status (approved/declined)
app.patch('/api/agency/me/bookings/:id', requireAuth, (req, res) => {
  const { status } = req.body || {};
  const allowed = new Set(['pending','approved','declined']);
  if (!allowed.has(status)) return res.status(400).json({ error: 'Invalid status' });

  const b = db.prepare(`SELECT id, agency_id FROM bookings WHERE id=?`).get(req.params.id);
  if (!b || b.agency_id !== req.agencyId) return res.status(404).json({ error: 'Not found' });

  db.prepare(`UPDATE bookings SET status=? WHERE id=?`).run(status, b.id);
  const row = db.prepare(`
    SELECT b.*, c.title AS car_title, c.daily_price, c.image_url
    FROM bookings b JOIN cars c ON c.id=b.car_id WHERE b.id=?`).get(b.id);
  res.json(row);
});

// NEW: delete a booking
app.delete('/api/agency/me/bookings/:id', requireAuth, (req, res) => {
  const b = db.prepare(`SELECT id, agency_id FROM bookings WHERE id=?`).get(req.params.id);
  if (!b || b.agency_id !== req.agencyId) return res.status(404).json({ error: 'Not found' });
  db.prepare(`DELETE FROM bookings WHERE id=?`).run(b.id);
  res.json({ ok: true });
});

// Public: view an agency catalog
app.get('/api/agency/:id/cars', (req, res) => {
  const ag = db.prepare(`SELECT id,name,location,phone,email FROM agencies WHERE id=?`).get(req.params.id);
  if (!ag) return res.status(404).json({ error: 'Not found' });
  const cars = db.prepare(`SELECT * FROM cars WHERE agency_id=? ORDER BY created_at DESC`).all(ag.id);
  res.json({ agency: ag, cars });
});

// start
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
