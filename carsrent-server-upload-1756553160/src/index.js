// server/src/index.js
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';

const app = express();

const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'dev-admin-token';

// ---------- CORS ----------
const allowList = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowList.includes('*') || allowList.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token'],
    credentials: false
  })
);

// ---------- JSON ----------
app.use(express.json());

// ---------- helpers ----------
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

function requireAdmin(req, res, next) {
  const t = req.header('x-admin-token') || req.query.admin_token;
  if (!t || t !== ADMIN_TOKEN) return res.status(401).json({ error: 'Admin token required' });
  next();
}

function tryNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ---------- health ----------
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ---------- agency auth ----------
app.post('/api/agency/register', (req, res) => {
  const { name, email, password, location, phone } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing name/email/password' });
  }

  const exists = db.prepare(`SELECT id FROM agencies WHERE email = ?`).get(email);
  if (exists) return res.status(400).json({ error: 'Email already in use' });

  const hash = bcrypt.hashSync(String(password), 10);
  const info = db
    .prepare(
      `INSERT INTO agencies(name,email,password_hash,location,phone)
       VALUES(?,?,?,?,?)`
    )
    .run(name, email, hash, location || null, phone || null);

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

// ---------- public cars ----------
app.get('/api/cars', (req, res) => {
  const { location, minPrice, maxPrice, category } = req.query;

  const where = [];
  const params = {};

  if (location) {
    where.push(`ag.location = @location`);
    params.location = location;
  }
  const minN = tryNumber(minPrice);
  const maxN = tryNumber(maxPrice);
  if (minN != null) {
    where.push(`c.daily_price >= @minPrice`);
    params.minPrice = minN;
  }
  if (maxN != null) {
    where.push(`c.daily_price <= @maxPrice`);
    params.maxPrice = maxN;
  }
  if (category && category !== 'any') {
    where.push(`c.category = @category`);
    params.category = category;
  }

  const rows = db
    .prepare(
      `
      SELECT
        c.*,
        ag.name AS agency_name,
        ag.phone AS agency_phone,
        ag.id   AS agency_id,
        ag.location
      FROM cars c
      JOIN agencies ag ON ag.id = c.agency_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY c.created_at DESC
    `
    )
    .all(params);

  res.json(rows);
});

app.get('/api/cars/:id', (req, res) => {
  const row = db
    .prepare(
      `
      SELECT
        c.*,
        ag.name  AS agency_name,
        ag.phone AS agency_phone,
        ag.id    AS agency_id,
        ag.location
      FROM cars c
      JOIN agencies ag ON ag.id = c.agency_id
      WHERE c.id = ?
    `
    )
    .get(req.params.id);

  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// ---------- public booking ----------
app.post('/api/bookings', (req, res) => {
  const {
    car_id,
    customer_name,
    customer_phone, // required
    customer_email, // optional
    start_date,     // optional
    end_date,       // optional
    message         // optional
  } = req.body || {};

  if (!car_id || !customer_name || !customer_phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate dates if both provided
  if (start_date && end_date) {
    const s = new Date(start_date);
    const e = new Date(end_date);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) {
      return res.status(400).json({ error: 'Invalid dates' });
    }
    if (e < s) {
      return res.status(400).json({ error: 'End date cannot be before start date' });
    }
  }

  const car = db.prepare(`SELECT id, agency_id FROM cars WHERE id = ?`).get(car_id);
  if (!car) return res.status(400).json({ error: 'Invalid car' });

  const info = db
    .prepare(
      `
      INSERT INTO bookings
      (car_id, agency_id, customer_name, customer_phone, customer_email, start_date, end_date, message, status)
      VALUES
      (@car_id, @agency_id, @customer_name, @customer_phone, @customer_email, @start_date, @end_date, @message, 'pending')
    `
    )
    .run({
      car_id,
      agency_id: car.agency_id,
      customer_name,
      customer_phone,
      customer_email: customer_email || null,
      start_date: start_date || null,
      end_date: end_date || null,
      message: message || null
    });

  const row = db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(info.lastInsertRowid);
  res.json(row);
});

// ---------- agency protected: cars ----------
app.post('/api/cars', requireAuth, (req, res) => {
  const {
    title,
    daily_price,
    image_url,
    year,
    transmission,
    seats,
    doors,
    fuel_type,
    category // new: sedan | suv | hatchback | coupe | van | other
  } = req.body || {};

  if (!title || daily_price == null) {
    return res.status(400).json({ error: 'Missing title/daily_price' });
  }

  const info = db
    .prepare(
      `
      INSERT INTO cars
      (agency_id, title, daily_price, image_url, year, transmission, seats, doors, fuel_type, category)
      VALUES
      (@agency_id, @title, @daily_price, @image_url, @year, @transmission, @seats, @doors, @fuel_type, @category)
    `
    )
    .run({
      agency_id: req.agencyId,
      title,
      daily_price: Number(daily_price),
      image_url: image_url || null,
      year: year || null,
      transmission: transmission || null,
      seats: seats || null,
      doors: doors || null,
      fuel_type: fuel_type || null,
      category: category || null
    });

  const row = db.prepare(`SELECT * FROM cars WHERE id = ?`).get(info.lastInsertRowid);
  res.json(row);
});

app.get('/api/agency/me/cars', requireAuth, (req, res) => {
  const rows = db
    .prepare(`SELECT * FROM cars WHERE agency_id = ? ORDER BY created_at DESC`)
    .all(req.agencyId);
  res.json(rows);
});

app.delete('/api/cars/:id', requireAuth, (req, res) => {
  const car = db
    .prepare(`SELECT id, agency_id FROM cars WHERE id = ?`)
    .get(req.params.id);
  if (!car || car.agency_id !== req.agencyId) return res.status(404).json({ error: 'Not found' });

  // remove dependent bookings first to avoid FK errors
  db.prepare(`DELETE FROM bookings WHERE car_id = ?`).run(car.id);
  db.prepare(`DELETE FROM cars WHERE id = ?`).run(car.id);

  res.json({ ok: true });
});

// ---------- agency protected: bookings ----------
app.get('/api/agency/me/bookings', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `
      SELECT b.*, c.title AS car_title, c.daily_price, c.image_url
      FROM bookings b
      JOIN cars c ON c.id = b.car_id
      WHERE b.agency_id = ?
      ORDER BY b.created_at DESC
    `
    )
    .all(req.agencyId);

  res.json(rows);
});

app.patch('/api/agency/me/bookings/:id', requireAuth, (req, res) => {
  const { status } = req.body || {};
  const allowed = new Set(['pending', 'approved', 'declined']);
  if (!allowed.has(status)) return res.status(400).json({ error: 'Invalid status' });

  const b = db
    .prepare(`SELECT id, agency_id FROM bookings WHERE id = ?`)
    .get(req.params.id);
  if (!b || b.agency_id !== req.agencyId) return res.status(404).json({ error: 'Not found' });

  db.prepare(`UPDATE bookings SET status = ? WHERE id = ?`).run(status, b.id);

  const row = db
    .prepare(
      `
      SELECT b.*, c.title AS car_title, c.daily_price, c.image_url
      FROM bookings b
      JOIN cars c ON c.id = b.car_id
      WHERE b.id = ?
    `
    )
    .get(b.id);

  res.json(row);
});

app.delete('/api/agency/me/bookings/:id', requireAuth, (req, res) => {
  const b = db
    .prepare(`SELECT id, agency_id FROM bookings WHERE id = ?`)
    .get(req.params.id);
  if (!b || b.agency_id !== req.agencyId) return res.status(404).json({ error: 'Not found' });

  db.prepare(`DELETE FROM bookings WHERE id = ?`).run(b.id);
  res.json({ ok: true });
});

// ---------- delete my agency account (cascade) ----------
app.delete('/api/agency/me', requireAuth, (req, res) => {
  const id = req.agencyId;

  // Bookings for this agency or any of its cars
  db.prepare(`DELETE FROM bookings WHERE agency_id = ?`).run(id);
  db.prepare(
    `DELETE FROM bookings WHERE car_id IN (SELECT id FROM cars WHERE agency_id = ?)`
  ).run(id);

  // Cars
  db.prepare(`DELETE FROM cars WHERE agency_id = ?`).run(id);

  // Agency
  db.prepare(`DELETE FROM agencies WHERE id = ?`).run(id);

  res.json({ ok: true });
});

// ---------- public agency catalog ----------
app.get('/api/agency/:id/cars', (req, res) => {
  const ag = db
    .prepare(`SELECT id, name, location, phone, email FROM agencies WHERE id = ?`)
    .get(req.params.id);
  if (!ag) return res.status(404).json({ error: 'Not found' });

  const cars = db
    .prepare(`SELECT * FROM cars WHERE agency_id = ? ORDER BY created_at DESC`)
    .all(ag.id);

  res.json({ agency: ag, cars });
});

// ---------- admin analytics ----------
app.get('/api/admin/stats', requireAdmin, (_req, res) => {
  const agencies = db.prepare(`SELECT COUNT(*) AS n FROM agencies`).get().n;
  const cars = db.prepare(`SELECT COUNT(*) AS n FROM cars`).get().n;
  const bookings = db.prepare(`SELECT COUNT(*) AS n FROM bookings`).get().n;
  const pending = db
    .prepare(`SELECT COUNT(*) AS n FROM bookings WHERE status = 'pending'`)
    .get().n;
  const approved = db
    .prepare(`SELECT COUNT(*) AS n FROM bookings WHERE status = 'approved'`)
    .get().n;

  // top 5 locations by car count
  const topLocations = db
    .prepare(
      `
      SELECT ag.location, COUNT(*) AS cars
      FROM cars c
      JOIN agencies ag ON ag.id = c.agency_id
      WHERE ag.location IS NOT NULL AND ag.location <> ''
      GROUP BY ag.location
      ORDER BY cars DESC
      LIMIT 5
    `
    )
    .all();

  res.json({ agencies, cars, bookings, pending, approved, topLocations });
});

// ---------- start ----------
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
