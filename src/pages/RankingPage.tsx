import { isFirebaseConfigured } from "../firebase";
import { Leaderboard } from "../components";

export function RankingPage() {
  return (
    <section className="page-stack ranking-screen">
      <div className="page-heading">
        <span className="eyebrow">{isFirebaseConfigured ? "Top global" : "Top local"}</span>
        <h1>Ranking</h1>
        <p>
          {isFirebaseConfigured
            ? "Si Firebase responde, ves el leaderboard global. Si falla, usamos tu fallback local."
            : "Demo local: tus puntajes se guardan solo en este navegador."}
        </p>
      </div>
      <Leaderboard />
      <div className="hero-actions">
        <a className="primary-link" href="/play">Volver a jugar</a>
        <a className="secondary-link" href="/">Volver al inicio</a>
      </div>
    </section>
  );
}
