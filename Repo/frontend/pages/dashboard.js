import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Nav from "../components/Nav";
import { api } from "../lib/api";
import { requireAuth } from "../lib/auth";

export default function Dashboard() {
  const router = useRouter();
  const [token, setToken] = useState(null);

  const [total, setTotal] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [msg, setMsg] = useState("");

  async function load(t) {
    setMsg("");
    const s = await api("/portfolio/summary", { token: t });
    setTotal(s.total_value_eur);
    const r = await api("/portfolio/snapshots?limit=7", { token: t });
    setSnapshots(r.snapshots);
  }

  useEffect(() => {
    const t = requireAuth(router);
    setToken(t);
    if (t) load(t).catch(e => setMsg(e.message));
  }, [router]);

  async function takeSnapshot() {
    setMsg("");
    try {
      await api("/portfolio/snapshots", { token, method: "POST" });
      await load(token);
    } catch (e) {
      setMsg(e.message);
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <Nav />
      <h2>Dashboard</h2>

      {msg && <p>{msg}</p>}

      <p><b>Total EUR:</b> {total === null ? "—" : `${total} €`}</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={takeSnapshot}>Create snapshot</button>
        <button onClick={() => load(token)}>Refresh</button>
      </div>

      <h3>Evolution (last 7)</h3>
      <ol>
        {snapshots.map(s => (
          <li key={s.id}>
            {new Date(s.captured_at).toLocaleString()} — {s.total_value_eur} €
          </li>
        ))}
        {snapshots.length === 0 && <li>No snapshots yet</li>}
      </ol>

      <p style={{ marginTop: 16 }}>
        Astuce : mets à jour les prix dans <a href="/prices">Prices</a> pour voir le total changer.
      </p>
    </main>
  );
}