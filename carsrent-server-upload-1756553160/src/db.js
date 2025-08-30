import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFile = process.env.DB_FILE || './data.db';
const dbPath = path.isAbsolute(dbFile) ? dbFile : path.join(__dirname, '..', dbFile);
const db = new Database(dbPath);

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function addColumnIfMissing(table, column, defSql) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  if (!cols.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${defSql}`);
}
addColumnIfMissing('agencies','phone','phone TEXT');
addColumnIfMissing('cars','year','year INTEGER');
addColumnIfMissing('cars','transmission','transmission TEXT');
addColumnIfMissing('cars','seats','seats INTEGER');
addColumnIfMissing('cars','doors','doors INTEGER');
addColumnIfMissing('cars','trunk_liters','trunk_liters REAL');
addColumnIfMissing('cars','fuel_type','fuel_type TEXT');
addColumnIfMissing('cars','options','options TEXT');

export default db;
