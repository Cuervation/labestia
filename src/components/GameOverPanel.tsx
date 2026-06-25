type GameOverPanelProps = {
  score: number;
  maxCombo: number;
  message: string;
  carsDestroyed?: number | null;
  missionsCompleted?: number;
  missionsTotal?: number;
  onRestart?: () => void;
};

export function GameOverPanel({
  score,
  maxCombo,
  message,
  carsDestroyed = null,
  missionsCompleted = 0,
  missionsTotal = 0,
  onRestart,
}: GameOverPanelProps) {
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
          <strong>{carsDestroyed ?? "-"}</strong>
        </div>
        <div className="stat-card">
          <span>Objetivos</span>
          <strong>
            {missionsCompleted}/{missionsTotal}
          </strong>
        </div>
      </div>
      <p className="status-line">{message}</p>
      <div className="hero-actions">
        <button className="primary-link" type="button" onClick={onRestart}>Jugar de nuevo</button>
        <a className="secondary-link" href="/ranking">Ver ranking</a>
      </div>
    </div>
  );
}
