import { useState } from "react";
import { useRouter } from "next/router";
import Nav from "../components/Nav";
import { api } from "../lib/api";
import { setToken, clearToken } from "../lib/auth";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    try {
      const r = await api("/auth/login", { method: "POST", body: { email, password } });
      setToken(r.token);
      router.push("/dashboard");
    } catch (err) {
      setMsg(err.message);
    }
  }

  function logout() {
    clearToken();
    setMsg("Logged out.");
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <Nav />
      <h2>Login</h2>

      <form onSubmit={submit} style={{ display: "grid", gap: 8, maxWidth: 360 }}>
        <input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit">Login</button>
      </form>

      <button onClick={logout} style={{ marginTop: 12 }}>Logout</button>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </main>
  );
}