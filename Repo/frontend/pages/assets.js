import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Nav from "../components/Nav";
import { api } from "../lib/api";
import { requireAuth } from "../lib/auth";

export default function Assets() {
  const router = useRouter();
  const [token, setToken] = useState(null);

  const [assets, setAssets] = useState([]);
  const [symbol, setSymbol] = useState("BTC");
  const [quantity, setQuantity] = useState("0.1");
  const [msg, setMsg] = useState("");

  async function refresh(t) {
    setMsg("");
    const r = await api("/portfolio/assets", { token: t });
    setAssets(r.assets);
  }

  useEffect(() => {
    const t = requireAuth(router);
    setToken(t);
    if (t) refresh(t).catch(e => setMsg(e.message));
  }, [router]);

  async function add(e) {
    e.preventDefault();
    setMsg("");
    try {
      await api("/portfolio/assets", { token, method: "POST", body: { symbol, quantity } });
      await refresh(token);
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function update(id, newQty) {
    setMsg("");
    try {
      await api(`/portfolio/assets/${id}`, { token, method: "PATCH", body: { quantity: newQty } });
      await refresh(token);
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function del(id) {
    setMsg("");
    try {
      await api(`/portfolio/assets/${id}`, { token, method: "DELETE" });
      await refresh(token);
    } catch (e) {
      setMsg(e.message);
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <Nav />
      <h2>Assets</h2>

      <form onSubmit={add} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <input value={symbol} onChange={e => setSymbol(e.target.value)} style={{ width: 90 }} />
        <input value={quantity} onChange={e => setQuantity(e.target.value)} style={{ width: 140 }} />
        <button type="submit">Add</button>
      </form>

      {msg && <p>{msg}</p>}

      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%", maxWidth: 700 }}>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Quantity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {assets.map(a => (
            <tr key={a.id}>
              <td>{a.symbol}</td>
              <td>
                <input
                  defaultValue={a.quantity}
                  style={{ width: 160 }}
                  onBlur={(e) => {
                    const v = e.target.value;
                    if (String(v) !== String(a.quantity)) update(a.id, v);
                  }}
                />
              </td>
              <td>
                <button onClick={() => del(a.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {assets.length === 0 && (
            <tr><td colSpan="3">No assets yet</td></tr>
          )}
        </tbody>
      </table>
    </main>
  );
}