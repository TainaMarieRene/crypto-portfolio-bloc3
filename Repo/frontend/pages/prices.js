import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Nav from "../components/Nav";
import { api } from "../lib/api";
import { requireAuth } from "../lib/auth";

export default function Prices() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [prices, setPrices] = useState([]);
  const [msg, setMsg] = useState("");

  async function load(t) {
    const r = await api("/prices", { token: t });
    setPrices(r.prices);
  }

  useEffect(() => {
    const t = requireAuth(router);
    setToken(t);
    if (t) load(t).catch(e => setMsg(e.message));
  }, [router]);

  async function update(symbol, price_eur) {
    setMsg("");
    try {
      await api(`/prices/${symbol}`, { token, method: "PUT", body: { price_eur } });
      await load(token);
      setMsg(`Updated ${symbol}`);
    } catch (e) {
      setMsg(e.message);
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <Nav />
      <h2>Prices</h2>
      <p>Cette page sert à mettre à jour les prix en DB (MVP) pour vérifier la valorisation.</p>
      {msg && <p>{msg}</p>}

      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%", maxWidth: 700 }}>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Price (EUR)</th>
            <th>Update</th>
          </tr>
        </thead>
        <tbody>
          {prices.map(p => (
            <tr key={p.symbol}>
              <td>{p.symbol}</td>
              <td>
                <input defaultValue={p.price_eur} style={{ width: 160 }} id={`price-${p.symbol}`} />
              </td>
              <td>
                <button
                  onClick={() => {
                    const v = document.getElementById(`price-${p.symbol}`).value;
                    update(p.symbol, Number(v));
                  }}
                >
                  Save
                </button>
              </td>
            </tr>
          ))}
          {prices.length === 0 && (
            <tr><td colSpan="3">No prices</td></tr>
          )}
        </tbody>
      </table>
    </main>
  );
}