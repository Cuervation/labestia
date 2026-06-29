type GameOverPanelProps = {
  score: number;
  maxCombo: number;
  message: string;
  carsDestroyed?: number | null;
  missionsCompleted?: number;
  missionsTotal?: number;
  bestiaActivations?: number;
  bestComboLabel?: string;
  endTitle?: string;
  onRestart?: () => void;
  onShowRanking?: () => void;
};

export function GameOverPanel({
  score,
  maxCombo,
  message,
  carsDestroyed = null,
  missionsCompleted = 0,
  missionsTotal = 0,
  bestiaActivations = 0,
  bestComboLabel = "",
  endTitle = "Destructor Callejero",
  onRestart,
  onShowRanking,
}: GameOverPanelProps) {
  return (
    <div className="panel game-over-panel">
      <div className="panel-header">
        <span className="eyebrow">Fin de partida</span>
        <h2>{endTitle}</h2>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <span>Score final</span>
          <strong>{score}</strong>
        </div>
        <div className="stat-card">
          <span>Max racha</span>
          <strong>x{maxCombo}</strong>
        </div>
        <div className="stat-card">
          <span>Mejor combo</span>
          <strong>{bestComboLabel || "-"}</strong>
        </div>
        <div className="stat-card">
          <span>Autos destruidos</span>
          <strong>{carsDestroyed ?? "-"}</strong>
        </div>
        <div className="stat-card">
          <span>Bestia Mode</span>
          <strong>{bestiaActivations}</strong>
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
        <button className="secondary-link" type="button" onClick={onShowRanking}>Ver ranking</button>
      </div>
    </div>
  );
}
