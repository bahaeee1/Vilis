// server/src/db.js
import Database from 'better-sqlite3';
const db = new Database(process.env.SQLITE_FILE || 'data.sqlite');

// Schema (idempotent)
db.exec(`
CREATE TABLE IF NOT EXISTS agencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  location TEXT,
  phone TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agency_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  daily_price INTEGER NOT NULL,
  image_url TEXT,
  year INTEGER,
  transmission TEXT,
  seats INTEGER,
  doors INTEGER,
  trunk_liters INTEGER,
  fuel_type TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (agency_id) REFERENCES agencies(id)
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  car_id INTEGER NOT NULL,
  agency_id INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  start_date TEXT,
  end_date TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (car_id) REFERENCES cars(id),
  FOREIGN KEY (agency_id) REFERENCES agencies(id)
);

CREATE INDEX IF NOT EXISTS idx_cars_agency ON cars(agency_id);
CREATE INDEX IF NOT EXISTS idx_bookings_agency ON bookings(agency_id);
CREATE INDEX IF NOT EXISTS idx_bookings_car ON bookings(car_id);
`);

// Safety: try adding status column if an old DB exists without it
try {
  const cols = db.prepare(`PRAGMA table_info(bookings)`).all();
  if (!cols.find(c => c.name === 'status')) {
    db.exec(`ALTER TABLE bookings ADD COLUMN status TEXT DEFAULT 'pending'`);
  }
} catch { /* ignore */ }

export default db;
