import Database from 'better-sqlite3';
import dotenv from 'dotenv';
dotenv.config();

const DB_FILE = process.env.DB_FILE || './local.sqlite';
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/* Minimal schema bootstrap (idempotent) */
db.exec(`
CREATE TABLE IF NOT EXISTS agencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  location TEXT NOT NULL,
  phone TEXT NOT NULL,
  verified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agency_id INTEGER NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  brand TEXT, model TEXT, year INTEGER,
  transmission TEXT, seats INTEGER, doors INTEGER, trunk_liters REAL,
  fuel_type TEXT,
  options TEXT,
  daily_price REAL NOT NULL,
  location TEXT NOT NULL,
  image_url TEXT, description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  total_price REAL NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

export default db;
