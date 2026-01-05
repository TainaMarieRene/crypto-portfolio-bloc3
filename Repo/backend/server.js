const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("./db");
const { authJwt } = require("./auth");

const app = express();
app.use(express.json());


if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET is missing or too short. Set it in repo/.env (>= 32 chars).");
  process.exit(1);
}


const FRONT_ORIGIN = process.env.FRONT_ORIGIN || "http://localhost:3000";
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", FRONT_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});


function isValidEmail(email) {
  return typeof email === "string" && email.includes("@") && email.length <= 254;
}
function normalizeSymbol(symbol) {
  return String(symbol || "").toUpperCase().trim();
}
function isValidSymbol(symbol) {
  
  return /^[A-Z0-9]{2,10}$/.test(symbol);
}
function toPositiveNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}


app.get("/health", (_, res) => res.json({ ok: true }));


app.post("/auth/register", async (req, res) => {
  const { email, password } = req.body || {};
  if (!isValidEmail(email) || typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "Invalid email or password too short (min 6 chars)" });
  }

  const password_hash = await bcrypt.hash(password, 10);
  try {
    const r = await pool.query(
      "INSERT INTO users(email, password_hash) VALUES($1,$2) RETURNING id,email",
      [email.toLowerCase(), password_hash]
    );
    return res.status(201).json({ user: r.rows[0] });
  } catch (e) {
    return res.status(400).json({ error: "Email already used" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!isValidEmail(email) || typeof password !== "string") {
    return res.status(400).json({ error: "email & password required" });
  }

  const r = await pool.query("SELECT id,email,password_hash FROM users WHERE email=$1", [email.toLowerCase()]);
  if (r.rowCount === 0) return res.status(401).json({ error: "Invalid credentials" });

  const user = r.rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "2h" });
  return res.json({ token });
});


app.get("/prices", authJwt, async (_req, res) => {
  const r = await pool.query("SELECT symbol, price_eur, updated_at FROM asset_prices ORDER BY symbol ASC");
  res.json({ prices: r.rows });
});

app.put("/prices/:symbol", authJwt, async (req, res) => {
  const symbol = normalizeSymbol(req.params.symbol);
  const price = Number(req.body?.price_eur);

  if (!isValidSymbol(symbol) || !Number.isFinite(price) || price < 0) {
    return res.status(400).json({ error: "Invalid symbol or price_eur" });
  }

  await pool.query(
    `INSERT INTO asset_prices(symbol, price_eur, updated_at)
     VALUES($1,$2,now())
     ON CONFLICT(symbol) DO UPDATE SET price_eur=EXCLUDED.price_eur, updated_at=now()`,
    [symbol, price]
  );
  res.json({ ok: true });
});

app.get("/portfolio/assets", authJwt, async (req, res) => {
  const r = await pool.query(
    "SELECT id, symbol, quantity, created_at FROM portfolio_assets WHERE user_id=$1 ORDER BY created_at DESC",
    [req.user.id]
  );
  res.json({ assets: r.rows });
});

app.post("/portfolio/assets", authJwt, async (req, res) => {
  const symbol = normalizeSymbol(req.body?.symbol);
  const quantity = toPositiveNumber(req.body?.quantity);

  if (!isValidSymbol(symbol) || quantity === null) {
    return res.status(400).json({ error: "Invalid symbol or quantity (must be > 0)" });
  }

  const r = await pool.query(
    "INSERT INTO portfolio_assets(user_id, symbol, quantity) VALUES($1,$2,$3) RETURNING id,symbol,quantity,created_at",
    [req.user.id, symbol, quantity]
  );
  res.status(201).json({ asset: r.rows[0] });
});

app.patch("/portfolio/assets/:id", authJwt, async (req, res) => {
  const id = Number(req.params.id);
  const quantity = toPositiveNumber(req.body?.quantity);

  if (!Number.isInteger(id) || id <= 0 || quantity === null) {
    return res.status(400).json({ error: "Invalid id or quantity" });
  }

  const r = await pool.query(
    "UPDATE portfolio_assets SET quantity=$1 WHERE id=$2 AND user_id=$3 RETURNING id,symbol,quantity,created_at",
    [quantity, id, req.user.id]
  );
  if (r.rowCount === 0) return res.status(404).json({ error: "Not found" });
  res.json({ asset: r.rows[0] });
});

app.delete("/portfolio/assets/:id", authJwt, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });

  const r = await pool.query("DELETE FROM portfolio_assets WHERE id=$1 AND user_id=$2", [id, req.user.id]);
  if (r.rowCount === 0) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

async function computeTotal(userId) {
  const r = await pool.query(
    `SELECT a.symbol, a.quantity, COALESCE(p.price_eur, 0) AS price_eur
     FROM portfolio_assets a
     LEFT JOIN asset_prices p ON p.symbol = a.symbol
     WHERE a.user_id=$1`,
    [userId]
  );

  let total = 0;
  for (const row of r.rows) {
    total += Number(row.quantity) * Number(row.price_eur);
  }

  
  return Math.round(total * 100) / 100;
}

app.get("/portfolio/summary", authJwt, async (req, res) => {
  const total = await computeTotal(req.user.id);
  res.json({ total_value_eur: total });
});

app.post("/portfolio/snapshots", authJwt, async (req, res) => {
  const total = await computeTotal(req.user.id);
  const r = await pool.query(
    "INSERT INTO portfolio_snapshots(user_id, total_value_eur) VALUES($1,$2) RETURNING id, total_value_eur, captured_at",
    [req.user.id, total]
  );
  res.status(201).json({ snapshot: r.rows[0] });
});

app.get("/portfolio/snapshots", authJwt, async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 7), 30);
  const r = await pool.query(
    "SELECT id, total_value_eur, captured_at FROM portfolio_snapshots WHERE user_id=$1 ORDER BY captured_at DESC LIMIT $2",
    [req.user.id, limit]
  );
  res.json({ snapshots: r.rows.reverse() });
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`API running on ${port}`));
