// server/src/db.js
import Database from 'better-sqlite3';

// --- Migration: ensure chauffeur_included exists on cars ---
try {
  db.prepare("ALTER TABLE cars ADD COLUMN chauffeur_included INTEGER DEFAULT 0").run();
} catch (e) {
  // ignore if column already exists
}


const DB_FILE = process.env.SQLITE_FILE || 'data.db';
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');

/**
 * Base tables (first run)
 * Note: cars table contains `category` (new). We still keep `trunk_liters` in DB
 * for backward compatibility, but the app no longer uses it.
 */
db.exec(`
CREATE TABLE IF NOT EXISTS agencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  password_hash TEXT NOT NULL,
  location TEXT,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agency_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  daily_price REAL NOT NULL,
  image_url TEXT,
  year INTEGER,
  transmission TEXT,
  seats INTEGER,
  doors INTEGER,
  trunk_liters INTEGER,           -- legacy (ignored by app)
  fuel_type TEXT,
  category TEXT,                  -- NEW
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);
`);

/** --- Light migrations (idempotent) --- */
function ensureColumn(table, col, type) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.find(c => c.name === col)) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`).run();
  }
}
ensureColumn('cars', 'category', 'TEXT'); // add if missing

export default db;
