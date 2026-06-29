import { Leaderboard } from "./Leaderboard";

type RankingPopupProps = {
  onClose: () => void;
};

export function RankingPopup({ onClose }: RankingPopupProps) {
  return (
    <div className="ranking-popup-backdrop" role="dialog" aria-modal="true" aria-label="Ranking">
      <div className="ranking-popup">
        <div className="ranking-popup-header">
          <h2>Ranking</h2>
          <button className="ranking-popup-close" type="button" onClick={onClose} aria-label="Cerrar ranking">
            ×
          </button>
        </div>
        <Leaderboard limit={10} compact showStatus={false} />
      </div>
    </div>
  );
}
