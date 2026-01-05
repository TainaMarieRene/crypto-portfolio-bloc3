import Nav from "../components/Nav";

export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <Nav />
      <h1>Crypto Portfolio</h1>
      <p>Application de gestion de portefeuille crypto (MVP).</p>
      <ul>
        <li>Auth (Register/Login)</li>
        <li>CRUD Assets</li>
        <li>Total portefeuille</li>
        <li>Snapshots d'évolution</li>
        <li>Gestion des prix (pour tester la valorisation)</li>
      </ul>
    </main>
  );
}