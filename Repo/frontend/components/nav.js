export default function Nav() {
  return (
    <nav style={{ display: "flex", gap: 12, marginBottom: 16 }}>
      <a href="/">Home</a>
      <a href="/dashboard">Dashboard</a>
      <a href="/assets">Assets</a>
      <a href="/prices">Prices</a>
      <a href="/login">Login</a>
      <a href="/register">Register</a>
    </nav>
  );
}
