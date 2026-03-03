const fs = require('fs');
const path = require('path');

let BetterSqlite3 = null;
try {
  BetterSqlite3 = require('better-sqlite3');
} catch (err) {
  BetterSqlite3 = null;
}

const DEFAULT_DB_PATH = path.join(__dirname, '..', 'data', 'easystay.db');

const getDbPath = () => process.env.SQLITE_DB_PATH || DEFAULT_DB_PATH;

const ensureParentDir = (targetPath) => {
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

let _db = null;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS entity_store (
  entity TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hotels (
  id TEXT PRIMARY KEY,
  city TEXT,
  star TEXT,
  min_price REAL,
  status TEXT,
  updated_at TEXT,
  payload TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hotels_city ON hotels(city);
CREATE INDEX IF NOT EXISTS idx_hotels_star ON hotels(star);
CREATE INDEX IF NOT EXISTS idx_hotels_min_price ON hotels(min_price);
CREATE INDEX IF NOT EXISTS idx_hotels_status ON hotels(status);
`;

const getDb = () => {
  if (!BetterSqlite3) return null;
  if (_db) return _db;
  const dbPath = getDbPath();
  ensureParentDir(dbPath);
  _db = new BetterSqlite3(dbPath);
  _db.pragma('journal_mode = WAL');
  _db.pragma('synchronous = NORMAL');
  _db.exec(SCHEMA_SQL);
  return _db;
};

const closeDb = () => {
  if (_db) {
    _db.close();
    _db = null;
  }
};

const normalizeMinPrice = (hotel) => {
  const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  if (Array.isArray(hotel?.roomTypes) && hotel.roomTypes.length) {
    const prices = hotel.roomTypes.map((r) => toNum(r?.price)).filter((n) => n !== null);
    if (prices.length) return Math.min(...prices);
  }
  return toNum(hotel?.price);
};

const saveEntityDataset = (entity, dataset) => {
  const db = getDb();
  if (!db) throw new Error('better-sqlite3_not_installed');
  const payload = JSON.stringify(dataset || []);
  const updatedAt = new Date().toISOString();

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO entity_store (entity, payload, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(entity) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at
    `).run(entity, payload, updatedAt);

    if (entity === 'hotels') {
      db.prepare('DELETE FROM hotels').run();
      const insertHotel = db.prepare(`
        INSERT INTO hotels (id, city, star, min_price, status, updated_at, payload)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const hotel of dataset || []) {
        if (!hotel || typeof hotel !== 'object') continue;
        insertHotel.run(
          String(hotel.id || `hotel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
          hotel.city || '',
          String(hotel.star || ''),
          normalizeMinPrice(hotel),
          hotel.status || '',
          hotel.updatedAt || updatedAt,
          JSON.stringify(hotel)
        );
      }
    }
  });

  tx();
};

const readEntityDataset = (entity) => {
  const db = getDb();
  if (!db) throw new Error('better-sqlite3_not_installed');
  const row = db.prepare('SELECT payload FROM entity_store WHERE entity = ?').get(entity);
  if (!row) return [];
  try {
    const parsed = JSON.parse(row.payload);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
};

module.exports = {
  isAvailable: () => Boolean(BetterSqlite3),
  getDbPath,
  getDb,
  closeDb,
  saveEntityDataset,
  readEntityDataset
};
