import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import db from './db.js';
import { emailAgency, emailCustomer } from './notify.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

/* ---------- middleware ---------- */
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Global basic rate limit (you can add route-specific ones if you prefer)
app.use(rateLimit({ windowMs: 5 * 60 * 1000, max: 100 }));

/* ---------- helpers ---------- */
function signToken(agency) {
  return jwt.sign(
    { id: agency.id, email: agency.email, name: agency.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
function auth(req, res, next) {
  const h = req.headers['authorization'];
  if (!h) return res.status(401).json({ error: 'Missing Authorization header' });
  const t = h.split(' ')[1];
  if (!t) return res.status(401).json({ error: 'Invalid Authorization header' });
  try {
    req.user = jwt.verify(t, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
function adminOnly(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Admin only' });
  }
  next();
}
const isISO = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);
const datesOK = (s, e) => new Date(s) <= new Date(e);
const daysBetween = (s, e) =>
  Math.ceil((new Date(e) - new Date(s)) / (1000 * 60 * 60 * 24));

/* ---------- validation ---------- */
const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  location: z.string().min(2),
  phone: z.string().min(6)
});
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
const CarSchema = z.object({
  title: z.string().min(2),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().optional(),
  transmission: z.enum(['manual', 'automatic']).optional(),
  seats: z.number().int().optional(),
  doors: z.number().int().optional(),
  trunk_liters: z.number().optional(),
  fuel_type: z.enum(['diesel', 'petrol', 'hybrid', 'electric']).optional(),
  options: z.string().optional(),
  daily_price: z.number().positive(),
  location: z.string().min(2),
  image_url: z.string().url().optional(),
  description: z.string().optional()
});
// Phone REQUIRED; Email OPTIONAL; keep dates but no availability enforcement
const BookingSchema = z
  .object({
    car_id: z.number().int().positive(),
    start_date: z.string(),
    end_date: z.string(),
    customer_name: z.string().min(2),
    customer_email: z.string().email().optional(),
    customer_phone: z.string().min(6),
    // hidden honeypot is allowed but ignored
    website: z.string().optional()
  })
  .refine(
    (d) => isISO(d.start_date) && isISO(d.end_date) && datesOK(d.start_date, d.end_date),
    { message: 'Invalid date range' }
  );

/* ---------- prepared statements ---------- */
const insertAgency = db.prepare(
  `INSERT INTO agencies (name,email,password_hash,location,phone) VALUES (?,?,?,?,?)`
);
const getAgencyByEmail = db.prepare(`SELECT * FROM agencies WHERE email = ?`);
const selectAgencyPublic = db.prepare(
  `SELECT id,name,location,phone,email,verified FROM agencies WHERE id = ?`
);

const insertCar = db.prepare(`
  INSERT INTO cars (agency_id,title,brand,model,year,transmission,seats,doors,trunk_liters,fuel_type,options,daily_price,location,image_url,description)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`);
const selectCarById = db.prepare(`SELECT * FROM cars WHERE id = ?`);
const selectCarWithAgency = db.prepare(`
  SELECT c.*, ag.name AS agency_name, ag.phone AS agency_phone
  FROM cars c JOIN agencies ag ON ag.id = c.agency_id
  WHERE c.id = ?
`);
const selectCarsByAgency = db.prepare(
  `SELECT * FROM cars WHERE agency_id = ? ORDER BY created_at DESC`
);

const insertAvail = db.prepare(
  `INSERT INTO availability (car_id,start_date,end_date) VALUES (?,?,?)`
);
const selectAvailByCar = db.prepare(
  `SELECT * FROM availability WHERE car_id = ? ORDER BY start_date`
);

const insertBooking = db.prepare(`
  INSERT INTO bookings (car_id,start_date,end_date,total_price,customer_name,customer_email,customer_phone,status)
  VALUES (?,?,?,?,?,?,?,'pending')
`);
const selectBookingsForAgency = db.prepare(`
  SELECT b.*, c.title AS car_title
  FROM bookings b JOIN cars c ON c.id = b.car_id
  WHERE c.agency_id = ?
  ORDER BY b.created_at DESC
`);

/* ---------- routes ---------- */
app.get('/api/health', (_req, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
);

/* Agency auth */
app.post('/api/agency/register', (req, res) => {
  // bot honeypot
  if (req.body?.website) return res.status(200).json({ ok: true });

  const p = RegisterSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });

  const { name, email, password, location, phone } = p.data;
  const existing = getAgencyByEmail.get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hash = bcrypt.hashSync(password, 10);
  const info = insertAgency.run(name, email, hash, location, phone);
  const agency = { id: info.lastInsertRowid, name, email, location, phone };
  const token = signToken(agency);
  res.json({ token, agency });
});

app.post('/api/agency/login', (req, res) => {
  const p = LoginSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });

  const { email, password } = p.data;
  const agency = getAgencyByEmail.get(email);
  if (!agency) return res.status(401).json({ error: 'Invalid credentials' });
  if (!bcrypt.compareSync(password, agency.password_hash))
    return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken(agency);
  res.json({
    token,
    agency: {
      id: agency.id,
      name: agency.name,
      email: agency.email,
      location: agency.location,
      phone: agency.phone,
      verified: !!agency.verified
    }
  });
});

/* Cars */
app.post('/api/cars', auth, (req, res) => {
  const p = CarSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });

  const d = p.data;
  const info = insertCar.run(
    req.user.id,
    d.title,
    d.brand || null,
    d.model || null,
    d.year || null,
    d.transmission || null,
    d.seats || null,
    d.doors || null,
    d.trunk_liters || null,
    d.fuel_type || null,
    d.options || null,
    d.daily_price,
    d.location,
    d.image_url || null,
    d.description || null
  );
  res.status(201).json(selectCarById.get(info.lastInsertRowid));
});

// Agency stock (private)
app.get('/api/agency/me/cars', auth, (req, res) => {
  res.json(selectCarsByAgency.all(req.user.id));
});

// Public agency catalog
app.get('/api/agency/:id/cars', (req, res) => {
  const id = Number(req.params.id);
  const agency = selectAgencyPublic.get(id);
  if (!agency) return res.status(404).json({ error: 'Agency not found' });
  const cars = selectCarsByAgency.all(id);
  res.json({ agency, cars });
});

// Optional availability endpoints (not enforced in booking)
app.post('/api/cars/:id/availability', auth, (req, res) => {
  const id = Number(req.params.id);
  const car = selectCarById.get(id);
  if (!car) return res.status(404).json({ error: 'Car not found' });
  if (car.agency_id !== req.user.id)
    return res.status(403).json({ error: 'Not your car' });

  const { start_date, end_date } = req.body || {};
  if (!isISO(start_date) || !isISO(end_date) || !datesOK(start_date, end_date)) {
    return res.status(400).json({ error: 'Invalid date range' });
  }
  insertAvail.run(id, start_date, end_date);
  res.json(selectAvailByCar.all(id));
});
app.get('/api/cars/:id/availability', (req, res) => {
  const id = Number(req.params.id);
  const car = selectCarById.get(id);
  if (!car) return res.status(404).json({ error: 'Car not found' });
  res.json(selectAvailByCar.all(id));
});

app.get('/api/cars/:id', (req, res) => {
  const id = Number(req.params.id);
  const row = selectCarWithAgency.get(id);
  if (!row) return res.status(404).json({ error: 'Car not found' });
  res.json(row);
});

app.get('/api/cars', (req, res) => {
  const { location, minPrice, maxPrice } = req.query;
  const filters = [];
  const params = [];
  let sql = `
    SELECT DISTINCT c.*, ag.name AS agency_name, ag.phone AS agency_phone
    FROM cars c
    JOIN agencies ag ON ag.id = c.agency_id
    LEFT JOIN availability a ON a.car_id = c.id
  `;
  if (location) {
    filters.push('c.location LIKE ?');
    params.push('%' + location + '%');
  }
  if (minPrice) {
    filters.push('c.daily_price >= ?');
    params.push(Number(minPrice));
  }
  if (maxPrice) {
    filters.push('c.daily_price <= ?');
    params.push(Number(maxPrice));
  }
  if (filters.length) sql += ' WHERE ' + filters.join(' AND ');
  sql += ' GROUP BY c.id ORDER BY c.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

/* Bookings (email optional, phone required; no availability checks) */
app.post('/api/bookings', async (req, res) => {
  // bot honeypot
  if (req.body?.website) return res.status(200).json({ ok: true });

  const p = BookingSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });

  const { car_id, start_date, end_date, customer_name, customer_email, customer_phone } = p.data;

  const car = selectCarById.get(car_id);
  if (!car) return res.status(404).json({ error: 'Car not found' });

  const days = daysBetween(start_date, end_date);
  if (days <= 0) return res.status(400).json({ error: 'End date must be after start date' });

  const total_price = days * car.daily_price;

  const info = insertBooking.run(
    car_id,
    start_date,
    end_date,
    total_price,
    customer_name,
    customer_email || null,
    customer_phone
  );

  const agencyRow = db
    .prepare(
      `
    SELECT ag.email AS agency_email, ag.name AS agency_name, ag.phone AS agency_phone, c.title AS car_title
    FROM cars c JOIN agencies ag ON ag.id = c.agency_id
    WHERE c.id = ?
  `
    )
    .get(car_id);

  // fire-and-forget emails (no blocking)
  const datesText = `${start_date} → ${end_date}`;
  try {
    await emailAgency({
      to: agencyRow.agency_email,
      agencyName: agencyRow.agency_name,
      carTitle: agencyRow.car_title,
      dates: datesText,
      customer: { name: customer_name, phone: customer_phone, email: customer_email || '' }
    });
    if (customer_email) {
      await emailCustomer({
        to: customer_email,
        agencyName: agencyRow.agency_name,
        agencyPhone: agencyRow.agency_phone,
        carTitle: agencyRow.car_title,
        dates: datesText
      });
    }
  } catch (e) {
    // log only; don't fail the booking on email issues
    console.error('Notify failed', e);
  }

  res.status(201).json({
    id: info.lastInsertRowid,
    total_price,
    status: 'pending',
    agency_name: agencyRow.agency_name,
    agency_phone: agencyRow.agency_phone
  });
});

app.get('/api/agency/me/bookings', auth, (req, res) => {
  res.json(selectBookingsForAgency.all(req.user.id));
});

/* Admin minimal endpoints */
app.patch('/api/admin/agencies/:id/verify', adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const { verified } = req.body || {};
  db.prepare(`UPDATE agencies SET verified = ? WHERE id = ?`).run(verified ? 1 : 0, id);
  res.json({ id, verified: !!verified });
});
app.delete('/api/admin/cars/:id', adminOnly, (req, res) => {
  const id = Number(req.params.id);
  db.prepare(`DELETE FROM cars WHERE id = ?`).run(id);
  res.json({ deleted: id });
});

/* ---------- start ---------- */
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
