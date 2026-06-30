type GameOverPanelProps = {
  score: number;
  maxCombo: number;
  message: string;
  carsDestroyed?: number | null;
  missionsCompleted?: number;
  missionsTotal?: number;
  endTitle?: string;
  onRestart?: () => void;
  onShowRanking?: () => void;
};

export function GameOverPanel({
  score,
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
      <div className="game-over-score">
        <span>Score final</span>
        <strong>{score}</strong>
      </div>
      <div className="game-over-actions">
        <button className="game-over-button game-over-button--primary" type="button" onClick={onRestart}>
          Jugar de nuevo
        </button>
        <button className="game-over-button game-over-button--secondary" type="button" onClick={onShowRanking}>
          Ver ranking
        </button>
        <a className="game-over-button game-over-button--exit" href="/">
          Salir
        </a>
      </div>
    </div>
  );
}
