type GameOverPanelProps = {
  score: number;
  maxCombo: number;
  message: string;
  autosDestroyed?: number | null;
};

export function GameOverPanel({ score, maxCombo, message, autosDestroyed = null }: GameOverPanelProps) {
  return (
    <div className="panel game-over-panel">
      <div className="panel-header">
        <span className="eyebrow">Fin de partida</span>
        <h2>LA BESTIA SIGUE</h2>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <span>Score final</span>
          <strong>{score}</strong>
        </div>
        <div className="stat-card">
          <span>Combo max</span>
          <strong>x{maxCombo}</strong>
        </div>
        <div className="stat-card">
          <span>Autos destruidos</span>
          <strong>{autosDestroyed ?? "—"}</strong>
        </div>
      </div>
      <p className="status-line">{message}</p>
      <div className="hero-actions">
        <a className="primary-link" href="/play">Jugar de nuevo</a>
        <a className="secondary-link" href="/ranking">Ver ranking</a>
      </div>
    </div>
  );
}
