import { useState } from "react";
import { useRouter } from "next/router";
import Nav from "../components/Nav";
import { api } from "../lib/api";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    try {
      await api("/auth/register", { method: "POST", body: { email, password } });
      router.push("/login");
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <Nav />
      <h2>Register</h2>

      <form onSubmit={submit} style={{ display: "grid", gap: 8, maxWidth: 360 }}>
        <input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input placeholder="password (min 6)" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit">Create account</button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </main>
  );
}