CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE portfolio_assets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  quantity NUMERIC(20,8) NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE asset_prices (
  symbol TEXT PRIMARY KEY,
  price_eur NUMERIC(20,8) NOT NULL CHECK (price_eur >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE portfolio_snapshots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_value_eur NUMERIC(20,8) NOT NULL CHECK (total_value_eur >= 0),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assets_user ON portfolio_assets(user_id);
CREATE INDEX idx_snapshots_user_time ON portfolio_snapshots(user_id, captured_at DESC);

INSERT INTO asset_prices(symbol, price_eur) VALUES
('BTC', 40000), ('ETH', 2000), ('SOL', 80)
ON CONFLICT (symbol) DO NOTHING;
