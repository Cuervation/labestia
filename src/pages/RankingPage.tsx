import { Leaderboard } from "../components";

export function RankingPage() {
  return (
    <section className="page-stack ranking-screen">
      <div className="page-heading">
        <span className="eyebrow">Top global</span>
        <h1>Ranking</h1>
        <p>Los mejores choques del barrio, ordenados por puntaje.</p>
      </div>
      <Leaderboard />
    </section>
  );
}
