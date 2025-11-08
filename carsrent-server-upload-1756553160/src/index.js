
// server/src/index.js  (ESM)
// Works with package.json: { "type": "module" }

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import { sendAgencyBookingEmail } from './mailer.js';

import { sendTestEmail } from './mailer.js';


// ========= ENV =========
const PORT        = Number(process.env.PORT || 10000);
const JWT_SECRET  = process.env.JWT_SECRET  || 'dev-jwt-secret';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'dev-admin-token';
const SQLITE_FILE = process.env.SQLITE_FILE || './data.sqlite';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const APP_BASE    = process.env.APP_BASE    || 'http://localhost:5173';

// ========= APP =========
const app = express();
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(','),
  credentials: false,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token']
}));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

// ========= DB =========
const db = new Database(SQLITE_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  // Agencies
  db.prepare(`
    CREATE TABLE IF NOT EXISTS agencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      location TEXT,         -- HQ city (optional)
      phone TEXT,
      created_at INTEGER NOT NULL
    )
  `).run();

  // Cars
  db.prepare(`
    CREATE TABLE IF NOT EXISTS cars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id INTEGER NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      daily_price INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      year INTEGER NOT NULL,
      transmission TEXT NOT NULL,
      seats INTEGER NOT NULL,
      doors INTEGER NOT NULL,
      fuel_type TEXT NOT NULL,
       chauffeur_option TEXT NOT NULL DEFAULT 'no',  -- 'yes' | 'no' | 'on_demand'
      category TEXT NOT NULL,
      delivery TEXT,              -- e.g., "Airport / Hotel / Sur demande"
deposit  INTEGER,           -- MAD; null = no deposit
      mileage_limit TEXT DEFAULT 'illimité',
      insurance TEXT DEFAULT 'incluse',
      min_age INTEGER DEFAULT 21,
      price_tiers TEXT,      -- JSON string (optional)
      created_at INTEGER NOT NULL
    )
  `).run();

  // Bookings
  db.prepare(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id INTEGER NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
      car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      price_total INTEGER,   -- computed by server
      created_at INTEGER NOT NULL
    )
  `).run();

  // Multi-city support for agencies
  db.prepare(`
    CREATE TABLE IF NOT EXISTS agency_cities (
      agency_id INTEGER NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
      city TEXT NOT NULL,
      PRIMARY KEY (agency_id, city)
    )
  `).run();

  // Migrations (safe)
  try { db.prepare('SELECT price_tiers FROM cars LIMIT 1').get(); }
  catch { db.prepare('ALTER TABLE cars ADD COLUMN price_tiers TEXT').run(); }

  try { db.prepare('SELECT price_total FROM bookings LIMIT 1').get(); }
  catch { db.prepare('ALTER TABLE bookings ADD COLUMN price_total INTEGER').run(); }

  try { db.prepare("SELECT mileage_limit FROM cars LIMIT 1").get(); }
catch { db.prepare("ALTER TABLE cars ADD COLUMN mileage_limit TEXT DEFAULT 'illimité'").run(); }

try { db.prepare("SELECT insurance FROM cars LIMIT 1").get(); }
catch { db.prepare("ALTER TABLE cars ADD COLUMN insurance TEXT DEFAULT 'incluse'").run(); }

try { db.prepare("SELECT min_age FROM cars LIMIT 1").get(); }
catch { db.prepare("ALTER TABLE cars ADD COLUMN min_age INTEGER DEFAULT 21").run(); }

  try { db.prepare("SELECT chauffeur_option FROM cars LIMIT 1").get(); }
catch { db.prepare("ALTER TABLE cars ADD COLUMN chauffeur_option TEXT DEFAULT 'no'").run(); }

// Add delivery if missing
try { db.prepare("SELECT delivery FROM cars LIMIT 1").get(); }
catch { db.prepare("ALTER TABLE cars ADD COLUMN delivery TEXT").run(); }

// Add deposit if missing
try { db.prepare("SELECT deposit FROM cars LIMIT 1").get(); }
catch { db.prepare("ALTER TABLE cars ADD COLUMN deposit INTEGER").run(); }

// Add options (TEXT JSON) if missing
try { db.prepare("SELECT options FROM cars LIMIT 1").get(); }
catch { db.prepare("ALTER TABLE cars ADD COLUMN options TEXT").run(); }

  // Add license_plate if missing
try { db.prepare("SELECT license_plate FROM cars LIMIT 1").get(); }
catch { db.prepare("ALTER TABLE cars ADD COLUMN license_plate TEXT").run(); }

// Add maps_url if missing
try { db.prepare("SELECT maps_url FROM cars LIMIT 1").get(); }
catch { db.prepare("ALTER TABLE cars ADD COLUMN maps_url TEXT").run(); }

  
// optional: if the old column exists, migrate values into the new column
try {
  const hasOld = db.prepare("SELECT 1 FROM pragma_table_info('cars') WHERE name='chauffeur_included'").get();
  if (hasOld) {
    db.prepare(`
      UPDATE cars
      SET chauffeur_option = CASE
        WHEN IFNULL(chauffeur_included, 0) = 1 THEN 'yes'
        ELSE 'no'
      END
    `).run();
  }
} catch {}




  // Indexes
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_cars_agency    ON cars(agency_id)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_cars_category  ON cars(category)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_bookings_agency ON bookings(agency_id, created_at)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_agcity_agency   ON agency_cities(agency_id)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_cars_chauffeur ON cars(chauffeur_option)`).run();

}
initSchema();

// ========= HELPERS =========
const now = () => Math.floor(Date.now() / 1000);

function signToken(agency) {
  return jwt.sign({ id: agency.id, email: agency.email }, JWT_SECRET, { expiresIn: '30d' });
}
function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer (.+)$/);
  if (!m) return res.status(401).json({ error: 'Auth required' });
  try {
    const payload = jwt.verify(m[1], JWT_SECRET);
    const ag = db.prepare('SELECT id, name, email, location, phone FROM agencies WHERE id = ?')
                 .get(payload.id);
    if (!ag) return res.status(401).json({ error: 'Invalid token' });
    req.user = ag;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
function requireAdmin(req, _res, next) {
  const token = req.header('x-admin-token') || req.query.admin_token;
  if (!token || token !== ADMIN_TOKEN) return next({ status: 401, message: 'Admin token required' });
  next();
}

// Tiered pricing
function normTiers(input) {
  if (!input) return [];
  const tiers = typeof input === 'string' ? JSON.parse(input) : input;
  if (!Array.isArray(tiers)) throw new Error('price_tiers must be array');

  const cleaned = tiers.map(t => ({
    minDays: Number(t.minDays),
    maxDays: t.maxDays == null || t.maxDays === '' ? null : Number(t.maxDays),
    price: Number(t.price)
  }))
  .filter(t => Number.isFinite(t.minDays) && t.minDays >= 1 && Number.isFinite(t.price) && t.price > 0)
  .map(t => ({ ...t, maxDays: t.maxDays != null && Number.isFinite(t.maxDays) ? t.maxDays : null }));

  cleaned.sort((a,b) => a.minDays - b.minDays);
  for (let i = 0; i < cleaned.length; i++) {
    const t = cleaned[i];
    if (t.maxDays != null && t.maxDays < t.minDays) throw new Error('Tier maxDays < minDays');
    if (i > 0) {
      const prevEnd = cleaned[i-1].maxDays ?? Infinity;
      if (t.minDays <= prevEnd) throw new Error('Overlapping tiers');
    }
  }
  return cleaned;
}
function daysBetween(startStr, endStr) {
  const s = new Date(startStr), e = new Date(endStr);
  let d = Math.ceil((e - s) / 86400000);
  return d < 1 ? 1 : d;
}
function pickDailyRate(dailyFallback, tiers, days) {
  if (!tiers || tiers.length === 0) return Number(dailyFallback);
  for (const t of tiers) {
    const max = t.maxDays ?? Infinity;
    if (days >= t.minDays && days <= max) return t.price;
  }
  return Number(dailyFallback);
}

app.post('/api/debug/migrate-category', (req, res) => {
  try {
    const has = db.prepare(
      "SELECT 1 FROM pragma_table_info('cars') WHERE name='category'"
    ).get();
    if (!has) {
      db.prepare("ALTER TABLE cars ADD COLUMN category TEXT DEFAULT 'SUV'").run();
      return res.json({ ok: true, action: 'added category column' });
    }
    return res.json({ ok: true, action: 'already exists' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
  });

  
  // Temporary migration: add "mileage_limit" to cars if missing
app.post('/api/debug/migrate-mileage', (req, res) => {
  try {
    const has = db
      .prepare("SELECT 1 FROM pragma_table_info('cars') WHERE name='mileage_limit'")
      .get();

    if (!has) {
      db.prepare("ALTER TABLE cars ADD COLUMN mileage_limit TEXT DEFAULT 'illimité'").run();
      return res.json({ ok: true, action: 'added mileage_limit column' });
    }

    return res.json({ ok: true, action: 'already exists' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// Temporary migration: add "insurance" (TEXT) and "min_age" (INTEGER) to cars if missing
app.post('/api/debug/migrate-insurance-age', (req, res) => {
  try {
    let actions = [];
    const hasIns = db.prepare("SELECT 1 FROM pragma_table_info('cars') WHERE name='insurance'").get();
    if (!hasIns) {
      db.prepare("ALTER TABLE cars ADD COLUMN insurance TEXT DEFAULT 'incluse'").run();
      actions.push('added insurance');
    }
    const hasAge = db.prepare("SELECT 1 FROM pragma_table_info('cars') WHERE name='min_age'").get();
    if (!hasAge) {
      db.prepare("ALTER TABLE cars ADD COLUMN min_age INTEGER DEFAULT 21").run();
      actions.push('added min_age');
    }
    if (actions.length === 0) return res.json({ ok: true, action: 'already exists' });
    return res.json({ ok: true, action: actions.join(', ') });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});


// ========= ROUTES =========

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'carsrent-api' }));

// ---- Agency auth ----
app.post('/api/agency/register', requireAdmin, (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.email || !b.password) return res.status(400).json({ error: 'name, email, password required' });
  const dup = db.prepare('SELECT id FROM agencies WHERE email = ?').get(String(b.email).toLowerCase());
  if (dup) return res.status(400).json({ error: 'Email already in use' });

  const hash = bcrypt.hashSync(String(b.password), 10);
  const info = db.prepare(`
    INSERT INTO agencies (name, email, password_hash, location, phone, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    String(b.name).trim(),
    String(b.email).toLowerCase(),
    hash,
    b.location || null,
    b.phone || null,
    now()
  );
  const agency = db.prepare('SELECT id, name, email, location, phone FROM agencies WHERE id = ?')
                   .get(info.lastInsertRowid);
  const token = signToken(agency);
  res.json({ token, agency });
});

app.post('/api/agency/login', (req, res) => {
  const b = req.body || {};
  const ag = db.prepare('SELECT * FROM agencies WHERE email = ?')
               .get(String(b.email || '').toLowerCase());
  if (!ag) return res.status(401).json({ error: 'Invalid email or password' });
  const ok = bcrypt.compareSync(String(b.password || ''), ag.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
  const agency = { id: ag.id, name: ag.name, email: ag.email, location: ag.location, phone: ag.phone };
  const token = signToken(agency);
  res.json({ token, agency });
});

app.get('/api/agency/me', requireAuth, (req, res) => res.json(req.user));
app.delete('/api/agency/me', requireAuth, (req, res) => {
  db.prepare('DELETE FROM agencies WHERE id = ?').run(req.user.id);
  res.json({ ok: true });
});

// ---- Multi-city management ----
app.put('/api/agency/me/cities', requireAuth, (req, res) => {
  const list = Array.isArray(req.body.cities) ? req.body.cities : [];
  const del = db.prepare('DELETE FROM agency_cities WHERE agency_id = ?');
  const ins = db.prepare('INSERT OR IGNORE INTO agency_cities (agency_id, city) VALUES (?, ?)');
  const tx = db.transaction((cities) => {
    del.run(req.user.id);
    for (const c of cities) {
      const city = String(c || '').trim();
      if (city) ins.run(req.user.id, city);
    }
  });
  tx(list);
  const rows = db.prepare('SELECT city FROM agency_cities WHERE agency_id = ? ORDER BY city')
                 .all(req.user.id);
  res.json({ cities: rows.map(r => r.city) });
});

app.get('/api/agency/me/cities', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT city FROM agency_cities WHERE agency_id = ? ORDER BY city')
                 .all(req.user.id);
  res.json({ cities: rows.map(r => r.city) });
});

app.put('/api/admin/agency/:id/cities', requireAdmin, (req, res) => {
  const agencyId = Number(req.params.id);
  const exists = db.prepare('SELECT id FROM agencies WHERE id = ?').get(agencyId);
  if (!exists) return res.status(404).json({ error: 'Not found' });

  const list = Array.isArray(req.body.cities) ? req.body.cities : [];
  const del = db.prepare('DELETE FROM agency_cities WHERE agency_id = ?');
  const ins = db.prepare('INSERT OR IGNORE INTO agency_cities (agency_id, city) VALUES (?, ?)');
  const tx = db.transaction((cities) => {
    del.run(agencyId);
    for (const c of cities) {
      const city = String(c || '').trim();
      if (city) ins.run(agencyId, city);
    }
  });
  tx(list);
  const rows = db.prepare('SELECT city FROM agency_cities WHERE agency_id = ? ORDER BY city')
                 .all(agencyId);
  res.json({ cities: rows.map(r => r.city) });
});

// ---- Cars ----
app.get('/api/cars', (req, res) => {
  const location = (req.query.location || '').trim();
  const category = (req.query.category || '').trim();
  const minPrice = req.query.minPrice ?? req.query.min_price;
  const maxPrice = req.query.maxPrice ?? req.query.max_price;
  const chauffeur = (req.query.chauffeur || '').toLowerCase();


  const where = [];
  const params = {};

  if (location) {
    // Match if agency HQ equals location OR agency is listed in agency_cities
    where.push(`(
      a.location = @loc OR EXISTS (
        SELECT 1 FROM agency_cities ac WHERE ac.agency_id = c.agency_id AND ac.city = @loc
      )
    )`);
    params.loc = location;
  }
  if (category) { where.push('c.category = @cat'); params.cat = category; }
  if (minPrice !== undefined && minPrice !== '') { where.push('c.daily_price >= @min'); params.min = Number(minPrice); }
  if (maxPrice !== undefined && maxPrice !== '') { where.push('c.daily_price <= @max'); params.max = Number(maxPrice); }
if (['yes','no','on_demand'].includes(chauffeur)) {
  where.push('c.chauffeur_option = @ch');
  params.ch = chauffeur;
}

  const sql = `
  SELECT
    c.id, c.agency_id, c.title, c.daily_price, c.image_url, c.year,
    c.transmission, c.seats, c.doors, c.fuel_type, c.chauffeur_option,
    c.category, c.mileage_limit, c.insurance, c.min_age,
    c.delivery, c.deposit, c.price_tiers, c.created_at,
    -- NOTE: license_plate intentionally NOT selected here (privacy)
    a.name  AS agency_name,
    a.phone AS agency_phone,
    a.email AS agency_email,
    a.location AS agency_location
  FROM cars c
  JOIN agencies a ON a.id = c.agency_id
  ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
  ORDER BY c.created_at DESC, c.id DESC
  LIMIT 300
  `;
  const rows = db.prepare(sql).all(params);
  res.json(rows);
});

app.get('/api/cars/:id', (req, res) => {
  const car = db.prepare(`
    SELECT
      c.id, c.agency_id, c.title, c.daily_price, c.image_url, c.year,
      c.transmission, c.seats, c.doors, c.fuel_type, c.chauffeur_option,
      c.category, c.mileage_limit, c.insurance, c.min_age,
      c.delivery, c.deposit, c.price_tiers, c.options, c.maps_url, c.created_at,
      -- license_plate NOT exposed here
      a.name AS agency_name, a.phone AS agency_phone,
      a.email AS agency_email, a.location AS agency_location
    FROM cars c
    JOIN agencies a ON a.id = c.agency_id
    WHERE c.id = ?
  `).get(req.params.id);

  if (!car) return res.status(404).json({ error: 'Not found' });

  try { car.price_tiers = car.price_tiers ? JSON.parse(car.price_tiers) : []; }
  catch { car.price_tiers = []; }

  try { car.options = car.options ? JSON.parse(car.options) : []; }
  catch { car.options = []; }

  res.json(car);
});



app.get('/api/agency/:agencyId(\\d+)/cars', (req, res) => {
  const agency = db.prepare('SELECT id, name, email, phone, location FROM agencies WHERE id = ?')
                   .get(req.params.agencyId);
  if (!agency) return res.status(404).json({ error: 'Agency not found' });
  const cars = db.prepare('SELECT * FROM cars WHERE agency_id = ? ORDER BY created_at DESC')
                 .all(agency.id);
  res.json({ agency, cars });
});

app.post('/api/cars', requireAuth, (req, res) => {
  const b = req.body || {};
  const required = ['title','daily_price','image_url','year','transmission','seats','doors','fuel_type','category','mileage_limit','insurance','min_age'];
  for (const k of required) {
    if (b[k] === undefined || b[k] === null || String(b[k]).trim() === '')
      return res.status(400).json({ error: `Missing ${k}` });
  }

// ---- options (optional) ----
function normOptions(input) {
  if (!input) return [];
  let arr = input;
  if (typeof input === 'string') {
    try { arr = JSON.parse(input); } catch { /* fallback below */ }
  }
  // If still a string like "GPS, Siège bébé", split by commas:
  if (typeof arr === 'string') arr = arr.split(',');

  if (!Array.isArray(arr)) return [];
  // trim, dedupe, keep short strings only
  const seen = new Set();
  const out = [];
  for (const raw of arr) {
    const s = String(raw || '').trim();
    if (!s) continue;
    if (s.length > 80) continue;           // prevent giant entries
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out.slice(0, 20); // cap to 20 options
}

  
  const year = Number(b.year);
  const seats = Number(b.seats);
  const doors = Number(b.doors);
  const price = Number(b.daily_price);
  const chauffeurOption = String(b.chauffeur_option || 'no').toLowerCase();
const validCh = new Set(['yes','no','on_demand']);
const finalChauffeur = validCh.has(chauffeurOption) ? chauffeurOption : 'no';
  const delivery = (b.delivery ?? null) ? String(b.delivery).trim() : null;
  const licensePlate = (b.license_plate ?? '').trim() || null; // optional
    const mapsUrl = (b.maps_url ?? '').trim() || null; // optional Google Maps link
  const options = normOptions(b.options); // optional
const deposit  = b.deposit === '' || b.deposit == null ? null : Number(b.deposit);
if (deposit != null && !(Number.isFinite(deposit) && deposit >= 0)) {
  return res.status(400).json({ error: 'Invalid deposit' });
}


  const maxYear = new Date().getFullYear() + 1;
  if (!(price > 0) || !(year >= 1990 && year <= maxYear) || !(seats >= 1 && seats <= 9) || !(doors >= 2 && doors <= 6)) {
    return res.status(400).json({ error: 'Invalid numeric values' });
  }

  let tiers = [];
  try { tiers = normTiers(b.price_tiers); } catch (e) {
    return res.status(400).json({ error: 'Invalid price_tiers: ' + e.message });
  }

    const info = db.prepare(`
  INSERT INTO cars (
    agency_id, title, daily_price, image_url, year, transmission, seats, doors,
    fuel_type, chauffeur_option, category, mileage_limit, insurance, min_age,
    delivery, deposit, license_plate, maps_url, options, price_tiers, created_at
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`).run(
  req.user.id,
  String(b.title).trim(),
  price,
  String(b.image_url).trim(),
  year,
  String(b.transmission),
  seats,
  doors,
  String(b.fuel_type),
  finalChauffeur,
  String(b.category),
  String(b.mileage_limit || 'illimité'),
  String(b.insurance || 'incluse'),
  Number(b.min_age || 21),
  delivery,
  deposit,
  licensePlate,
  mapsUrl, // ✅ added this between licensePlate and options
  JSON.stringify(options),
  JSON.stringify(tiers),
  now()
);




  const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(info.lastInsertRowid);
  res.json({ car });
});

// ---- Update a car (partial) ----
app.patch('/api/cars/:id', requireAuth, (req, res) => {
  const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(req.params.id);
  if (!car) return res.status(404).json({ error: 'Not found' });
  if (car.agency_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const b = req.body || {};

  // Reuse helpers
  function safeNum(x) { const n = Number(x); return Number.isFinite(n) ? n : null; }
  const updates = [];
  const params  = { id: car.id };

  // Text fields
  if (b.title != null)         { updates.push('title = @title');               params.title = String(b.title).trim(); }
  if (b.image_url != null)     { updates.push('image_url = @image_url');       params.image_url = String(b.image_url).trim(); }
  if (b.transmission != null)  { updates.push('transmission = @transmission'); params.transmission = String(b.transmission); }
  if (b.fuel_type != null)     { updates.push('fuel_type = @fuel_type');       params.fuel_type = String(b.fuel_type); }
  if (b.category != null)      { updates.push('category = @category');         params.category = String(b.category); }
  if (b.mileage_limit != null) { updates.push('mileage_limit = @mileage_limit'); params.mileage_limit = String(b.mileage_limit); }
  if (b.insurance != null)     { updates.push('insurance = @insurance');       params.insurance = String(b.insurance); }
  if (b.delivery != null)      { updates.push('delivery = @delivery');         params.delivery = String(b.delivery || '').trim() || null; }

  // Numbers
  if (b.daily_price != null) {
    const n = safeNum(b.daily_price);
    if (!(n > 0)) return res.status(400).json({ error: 'Invalid daily_price' });
    updates.push('daily_price = @daily_price'); params.daily_price = n;
  }
  if (b.year != null) {
    const n = safeNum(b.year);
    const maxYear = new Date().getFullYear() + 1;
    if (!(n >= 1990 && n <= maxYear)) return res.status(400).json({ error: 'Invalid year' });
    updates.push('year = @year'); params.year = n;
  }
  if (b.seats != null) {
    const n = safeNum(b.seats);
    if (!(n >= 1 && n <= 9)) return res.status(400).json({ error: 'Invalid seats' });
    updates.push('seats = @seats'); params.seats = n;
  }
  if (b.doors != null) {
    const n = safeNum(b.doors);
    if (!(n >= 2 && n <= 6)) return res.status(400).json({ error: 'Invalid doors' });
    updates.push('doors = @doors'); params.doors = n;
  }
  if (b.min_age != null) {
    const n = safeNum(b.min_age);
    if (!(n >= 18 && n <= 30)) return res.status(400).json({ error: 'Invalid min_age' });
    updates.push('min_age = @min_age'); params.min_age = n;
  }

  // Chauffeur option
  if (b.chauffeur_option != null) {
    const s = String(b.chauffeur_option || '').toLowerCase();
    if (!['yes','no','on_demand'].includes(s)) return res.status(400).json({ error: 'Invalid chauffeur_option' });
    updates.push('chauffeur_option = @chauffeur_option'); params.chauffeur_option = s;
  }

  // Deposit
  if (b.deposit !== undefined) {
    if (b.deposit === null || b.deposit === '') { updates.push('deposit = NULL'); }
    else {
      const n = safeNum(b.deposit);
      if (!(n >= 0)) return res.status(400).json({ error: 'Invalid deposit' });
      updates.push('deposit = @deposit'); params.deposit = n;
    }
  }

  // Tiers
  if (b.price_tiers !== undefined) {
    let tiers = [];
    try { tiers = normTiers(b.price_tiers); }
    catch (e) { return res.status(400).json({ error: 'Invalid price_tiers: ' + e.message }); }
    updates.push('price_tiers = @price_tiers'); params.price_tiers = JSON.stringify(tiers);
  }

  // Options (array of strings or comma string)
  function normOptions(input) {
    if (!input) return [];
    let arr = input;
    if (typeof input === 'string') {
      try { arr = JSON.parse(input); } catch { arr = input.split(','); }
    }
    if (!Array.isArray(arr)) return [];
    const seen = new Set(), out = [];
    for (const raw of arr) {
      const s = String(raw || '').trim();
      if (!s || s.length > 80) continue;
      const k = s.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k); out.push(s);
    }
    return out.slice(0, 20);
  }
  if (b.options !== undefined) {
    const opts = normOptions(b.options);
    updates.push('options = @options'); params.options = JSON.stringify(opts);
  }

  if (updates.length === 0) return res.json({ ok: true, unchanged: true });

  const sql = `UPDATE cars SET ${updates.join(', ')} WHERE id = @id`;
  db.prepare(sql).run(params);

  const updated = db.prepare(`
    SELECT c.*, a.name AS agency_name, a.phone AS agency_phone, a.email AS agency_email, a.location AS agency_location
    FROM cars c JOIN agencies a ON a.id = c.agency_id
    WHERE c.id = ?
  `).get(car.id);

  // Normalize JSON fields in response
  try { updated.price_tiers = updated.price_tiers ? JSON.parse(updated.price_tiers) : []; } catch { updated.price_tiers = []; }
  try { updated.options     = updated.options ? JSON.parse(updated.options) : []; } catch { updated.options = []; }

  res.json({ car: updated });
});

app.delete('/api/cars/:id', requireAuth, (req, res) => {
  const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(req.params.id);
  if (!car) return res.status(404).json({ error: 'Not found' });
  if (car.agency_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM cars WHERE id = ?').run(car.id);
  res.json({ ok: true });
});

// PATCH: update a car (partial, only own cars)
app.patch('/api/cars/:id', requireAuth, (req, res) => {
  const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(req.params.id);
  if (!car) return res.status(404).json({ error: 'Not found' });
  if (car.agency_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const b = req.body || {};
  const patch = {};
  const set = [];
  const params = [];

  function setIfPresent(key, transform = (x) => x) {
    if (b[key] !== undefined) {
      patch[key] = transform(b[key]);
      set.push(`${key} = ?`);
      params.push(patch[key]);
    }
  }

  // basic scalars
  setIfPresent('title', (v) => String(v).trim());
  setIfPresent('daily_price', (v) => Number(v));
  setIfPresent('image_url', (v) => String(v).trim());
  setIfPresent('year', (v) => Number(v));
  setIfPresent('transmission', (v) => String(v));
  setIfPresent('seats', (v) => Number(v));
  setIfPresent('doors', (v) => Number(v));
  setIfPresent('fuel_type', (v) => String(v));
  setIfPresent('category', (v) => String(v));
  setIfPresent('mileage_limit', (v) => String(v));
    setIfPresent('maps_url', (v) =>
    v == null || String(v).trim() === '' ? null : String(v).trim()
  );
  setIfPresent('insurance', (v) => String(v));
  setIfPresent('min_age', (v) => Number(v));

  // chauffeur_option strict enum
  if (b.chauffeur_option !== undefined) {
    const s = String(b.chauffeur_option || 'no').toLowerCase();
    const ok = new Set(['yes', 'no', 'on_demand']);
    const final = ok.has(s) ? s : 'no';
    set.push(`chauffeur_option = ?`);
    params.push(final);
  }

  // delivery, deposit
  setIfPresent('delivery', (v) => (v == null || String(v).trim() === '' ? null : String(v).trim()));
  if (b.deposit !== undefined) {
    const d = b.deposit === '' || b.deposit == null ? null : Number(b.deposit);
    if (d != null && !(Number.isFinite(d) && d >= 0)) return res.status(400).json({ error: 'Invalid deposit' });
    set.push(`deposit = ?`);
    params.push(d);
  }

  // options (array) & price_tiers (array)
  if (b.options !== undefined) {
    let arr = b.options;
    if (typeof arr === 'string') {
      try { arr = JSON.parse(arr); } catch { arr = arr.split(','); }
    }
    if (!Array.isArray(arr)) arr = [];
    arr = arr
      .map((x) => String(x || '').trim())
      .filter(Boolean)
      .slice(0, 20);
    set.push(`options = ?`);
    params.push(JSON.stringify(arr));
  }

  if (b.price_tiers !== undefined) {
    let tiers = [];
    try { tiers = normTiers(b.price_tiers); } catch (e) {
      return res.status(400).json({ error: 'Invalid price_tiers: ' + e.message });
    }
    set.push(`price_tiers = ?`);
    params.push(JSON.stringify(tiers));
  }

  if (set.length === 0) return res.json({ ok: true, car });

  params.push(car.id);
  const sql = `UPDATE cars SET ${set.join(', ')} WHERE id = ?`;
  db.prepare(sql).run(params);

  const updated = db.prepare('SELECT * FROM cars WHERE id = ?').get(car.id);
  res.json({ ok: true, car: updated });
});


app.get('/api/agency/me/cars', requireAuth, (req, res) => {
  const cars = db.prepare('SELECT * FROM cars WHERE agency_id = ? ORDER BY created_at DESC')
                 .all(req.user.id);
  res.json(cars);
});

// ---- Bookings ----
app.post('/api/bookings', (req, res) => {
  const b = req.body || {};
  if (!b.car_id || !b.name || !b.phone || !b.start_date || !b.end_date)
    return res.status(400).json({ error: 'car_id, name, phone, start_date, end_date required' });

  const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(b.car_id);
  if (!car) return res.status(404).json({ error: 'Car not found' });

  let tiers = [];
  try { tiers = normTiers(car.price_tiers); } catch { tiers = []; }
  const days  = daysBetween(b.start_date, b.end_date);
  const daily = pickDailyRate(car.daily_price, tiers, days);
  const total = daily * days;

  const info = db.prepare(`
    INSERT INTO bookings (agency_id, car_id, name, phone, start_date, end_date, status, price_total, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `).run(car.agency_id, car.id, String(b.name).trim(), String(b.phone).trim(), b.start_date, b.end_date, total, now());
try {
  const agency = db.prepare('SELECT * FROM agencies WHERE id = ?').get(car.agency_id);
  if (agency && agency.email) {
    setImmediate(() => {
      sendAgencyBookingEmail({
        to: agency.email,
        agencyName: agency.name,
        carTitle: car.title || 'Nouvelle réservation',
        booking: {
          customer_name: String(b.name).trim(),
          customer_phone: String(b.phone).trim(),
          start_date: b.start_date,
          end_date: b.end_date,
          total_price: total,
        },
        replyTo: b.email || undefined,
      }).catch(err => console.error('[email] send failed', err));
    });
  } else {
    console.warn('[email] Agency has no email, skipping');
  }
} catch (e) {
  console.error('[email] lookup failed', e);
}
  
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(info.lastInsertRowid);
  res.json({ booking, days, daily_rate: daily, currency: 'MAD' });
});

app.get('/api/agency/me/bookings', requireAuth, (req, res) => {
  const rows = db.prepare(`
  SELECT
    b.*,
    c.title       AS car_title,
    c.image_url   AS car_image_url,
    c.license_plate AS car_plate
  FROM bookings b
  JOIN cars c ON c.id = b.car_id
  WHERE b.agency_id = ?
  ORDER BY b.created_at DESC
`).all(req.user.id);
  res.json(rows);
});

app.patch('/api/agency/me/bookings/:id', requireAuth, (req, res) => {
  const { status } = req.body || {};
  if (!['pending','approved','declined','completed','cancelled'].includes(status))
    return res.status(400).json({ error: 'Invalid status' });

  const row = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  if (row.agency_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, row.id);
  res.json({ ok: true });
});

app.delete('/api/agency/me/bookings/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  if (row.agency_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM bookings WHERE id = ?').run(row.id);
  res.json({ ok: true });
});


// Test email route
app.post('/api/test-email', async (req, res) => {
  try {
    const { to } = req.body || {};
    if (!to) return res.status(400).json({ error: 'Missing "to" in body' });
    const { sendTestEmail } = await import('./mailer.js');
    const result = await sendTestEmail(to);
    return res.json({ ok: true, result });
  } catch (e) {
    console.error('[test-email] failed', e?.response?.data || e?.message || e);
    return res.status(500).json({ ok: false, error: e?.response?.data || String(e) });
  }
});



// ---- Admin stats ----
app.get('/api/admin/stats', requireAdmin, (_req, res) => {
  const agencies = db.prepare('SELECT COUNT(*) AS n FROM agencies').get().n;
  const cars     = db.prepare('SELECT COUNT(*) AS n FROM cars').get().n;
  const bookings = db.prepare('SELECT COUNT(*) AS n FROM bookings').get().n;
  res.json({ agencies, cars, bookings });
});

// ========= START =========
app.listen(PORT, () => {
  console.log(`CarsRent API listening on http://localhost:${PORT}`);
});
