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
