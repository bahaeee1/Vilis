// server/src/index.js
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';

const app = express();

// --- middleware ---
app.use(cors()); // if you want to restrict: cors({ origin: ['https://YOUR-CLIENT.vercel.app'] })
app.use(express.json({ limit: '1mb' }));

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
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// --- agency auth ---
app.post('/api/agency/register', (req, res) => {
  const { name, email, password, location, phone } = req.body || {};
  if (!name || !password) return res.status(400).json({ error: 'Missing name/password' });

  const hash = bcrypt.hashSync(String(password), 10);
  const info = db
    .prepare(`INSERT INTO agencies(name,email,password_hash,location,phone) VALUES(?,?,?,?,?)`)
    .run(String(name).trim(), email || null, hash, location || null, phone || null);

  const agency = db
    .prepare(`SELECT id,name,email,location,phone FROM agencies WHERE id=?`)
    .get(info.lastInsertRowid);

  res.json({ token: signToken(agency), agency });
});

app.post('/api/agency/login', (req, res) => {
  const { email, password } = req.body || {};
  const ag = db.prepare(`SELECT * FROM agencies WHERE email=?`).get(email || '');
  if (!ag) return res.status(400).json({ error: 'Invalid email or password' });
  if (!bcrypt.compareSync(String(password || ''), ag.password_hash)) {
    return res.status(400).json({ error: 'Invalid email or password' });
  }
  res.json({
    token: signToken(ag),
    agency: { id: ag.id, name: ag.name, email: ag.email, location: ag.location, phone: ag.phone }
  });
});

// --- public cars: search & get ---
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
    FROM cars c
    JOIN agencies ag ON ag.id = c.agency_id
    WHERE c.id = ?
  `).get(req.params.id);

  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// --- public bookings: always 'pending' initially ---
app.post('/api/bookings', (req, res) => {
  const {
    car_id, customer_name, customer_phone, customer_email,
    start_date, end_date, message
  } = req.body || {};

  if (!car_id || !customer_name || !customer_phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const car = db.prepare(`SELECT id, agency_id FROM cars WHERE id=?`).get(car_id);
  if (!car) return res.status(400).json({ error: 'Invalid car' });

  const info = db.prepare(`
    INSERT INTO bookings(
      car_id, agency_id, customer_name, customer_phone, customer_email,
      start_date, end_date, message, status)
    VALUES(@car_id,@agency_id,@customer_name,@customer_phone,@customer_email,
           @start_date,@end_date,@message,'pending')
  `).run({
    car_id,
    agency_id: car.agency_id,
    customer_name: String(customer_name).trim(),
    customer_phone: String(customer_phone).trim(),
    customer_email: customer_email ? String(customer_email).trim() : null,
    start_date: start_date || null,
    end_date: end_date || null,
    message: message ? String(message).trim() : null
  });

  const row = db.prepare(`SELECT * FROM bookings WHERE id=?`).get(info.lastInsertRowid);
  res.json(row);
});

// --- agency protected: cars CRUD & my bookings ---

// CREATE car (hardened)
app.post('/api/cars', requireAuth, (req, res, next) => {
  try {
    const {
      title, daily_price, image_url, year,
      transmission, seats, doors, trunk_liters, fuel_type
    } = req.body || {};

    if (!title || daily_price == null || isNaN(Number(daily_price))) {
      return res.status(400).json({ error: 'title and daily_price are required' });
    }

    const clean = {
      title: String(title).trim(),
      daily_price: Math.max(0, Math.round(Number(daily_price))),
      image_url: image_url ? String(image_url).slice(0, 1024) : null,
      year: year ? Number(year) : null,
      transmission: transmission ? String(transmission) : null,
      seats: seats ? Number(seats) : null,
      doors: doors ? Number(doors) : null,
      trunk_liters: trunk_liters ? Number(trunk_liters) : null,
      fuel_type: fuel_type ? String(fuel_type) : null
    };

    if (clean.transmission && !['manual','automatic'].includes(clean.transmission)) {
      return res.status(400).json({ error: 'invalid transmission' });
    }
    if (clean.fuel_type && !['diesel','petrol','hybrid','electric'].includes(clean.fuel_type)) {
      return res.status(400).json({ error: 'invalid fuel' });
    }

    const info = db.prepare(`
      INSERT INTO cars(
        agency_id,title,daily_price,image_url,year,transmission,
        seats,doors,trunk_liters,fuel_type)
      VALUES(?,?,?,?,?,?,?,?,?,?)
    `).run(
      req.agencyId, clean.title, clean.daily_price, clean.image_url, clean.year,
      clean.transmission, clean.seats, clean.doors, clean.trunk_liters, clean.fuel_type
    );

    const row = db.prepare(`SELECT * FROM cars WHERE id=?`).get(info.lastInsertRowid);
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// READ: my cars
app.get('/api/agency/me/cars', requireAuth, (req, res) => {
  const rows = db
    .prepare(`SELECT * FROM cars WHERE agency_id=? ORDER BY created_at DESC`)
    .all(req.agencyId);
  res.json(rows);
});

// DELETE car
app.delete('/api/cars/:id', requireAuth, (req, res) => {
  const car = db.prepare(`SELECT id, agency_id FROM cars WHERE id=?`).get(req.params.id);
  if (!car || car.agency_id !== req.agencyId) return res.status(404).json({ error: 'Not found' });

  // optional: delete related bookings for that car
  db.prepare(`DELETE FROM bookings WHERE car_id=?`).run(car.id);
  db.prepare(`DELETE FROM cars WHERE id=?`).run(car.id);

  res.json({ ok: true });
});

// READ: my bookings
app.get('/api/agency/me/bookings', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT b.*, c.title AS car_title, c.daily_price, c.image_url
    FROM bookings b
    JOIN cars c ON c.id = b.car_id
    WHERE b.agency_id = ?
    ORDER BY b.created_at DESC
  `).all(req.agencyId);
  res.json(rows);
});

// UPDATE booking status
app.patch('/api/agency/me/bookings/:id', requireAuth, (req, res) => {
  const { status } = req.body || {};
  const allowed = new Set(['pending','approved','declined']);
  if (!allowed.has(status)) return res.status(400).json({ error: 'Invalid status' });

  const b = db.prepare(`SELECT id, agency_id FROM bookings WHERE id=?`).get(req.params.id);
  if (!b || b.agency_id !== req.agencyId) return res.status(404).json({ error: 'Not found' });

  db.prepare(`UPDATE bookings SET status=? WHERE id=?`).run(status, b.id);
  const row = db.prepare(`
    SELECT b.*, c.title AS car_title, c.daily_price, c.image_url
    FROM bookings b JOIN cars c ON c.id=b.car_id WHERE b.id=?
  `).get(b.id);
  res.json(row);
});

// DELETE booking
app.delete('/api/agency/me/bookings/:id', requireAuth, (req, res) => {
  const b = db.prepare(`SELECT id, agency_id FROM bookings WHERE id=?`).get(req.params.id);
  if (!b || b.agency_id !== req.agencyId) return res.status(404).json({ error: 'Not found' });
  db.prepare(`DELETE FROM bookings WHERE id=?`).run(b.id);
  res.json({ ok: true });
});

// --- public: view agency catalog ---
app.get('/api/agency/:id/cars', (req, res) => {
  const ag = db.prepare(`SELECT id,name,location,phone,email FROM agencies WHERE id=?`).get(req.params.id);
  if (!ag) return res.status(404).json({ error: 'Not found' });
  const cars = db.prepare(`SELECT * FROM cars WHERE agency_id=? ORDER BY created_at DESC`).all(ag.id);
  res.json({ agency: ag, cars });
});

// --- delete my agency account & all data ---
app.delete('/api/agency/me', requireAuth, (req, res) => {
  const id = req.agencyId;

  // delete agency's bookings or bookings of its cars
  db.prepare(`DELETE FROM bookings WHERE agency_id = ?`).run(id);
  db.prepare(`DELETE FROM bookings WHERE car_id IN (SELECT id FROM cars WHERE agency_id = ?)`).run(id);

  // delete cars, then agency
  db.prepare(`DELETE FROM cars WHERE agency_id = ?`).run(id);
  db.prepare(`DELETE FROM agencies WHERE id = ?`).run(id);

  res.json({ ok: true });
});

// --- JSON error handler (prevents HTML error pages) ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    error: err?.message || 'Internal Server Error'
  });
});

// --- start ---
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
