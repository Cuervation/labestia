import { useEffect, useState } from "react";
import { GameCanvas, GameOverPanel, RankingPopup } from "../components";
import { isFirebaseConfigured, saveGameRun, updateLeaderboard } from "../firebase";
import type { GameRunResult } from "../firebase";
import { saveLocalScore } from "../storage/localScores";
import { useAuthStore } from "../store";

type GameOverEventDetail = {
  score?: number;
  maxCombo?: number;
  carsDestroyed?: number;
  durationSeconds?: number;
  missionsCompleted?: number;
  missionsTotal?: number;
  endTitle?: string;
};

function dispatchPlayerControl(direction: -1 | 0 | 1) {
  window.dispatchEvent(new CustomEvent("laBestia:playerControl", { detail: { direction } }));
}

export function PlayPage() {
  const user = useAuthStore((state) => state.user);
  const [gameKey, setGameKey] = useState(0);
  const [rankingOpen, setRankingOpen] = useState(false);
  const [gameOverResult, setGameOverResult] = useState<{
    score: number;
    maxCombo: number;
    carsDestroyed?: number | null;
    missionsCompleted?: number;
    missionsTotal?: number;
    endTitle?: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    const handleGameOver = async (event: Event) => {
      const customEvent = event as CustomEvent<GameOverEventDetail>;
      const score = Number(customEvent.detail?.score ?? 0);
      const maxCombo = Number(customEvent.detail?.maxCombo ?? 1);
      const carsDestroyed =
        typeof customEvent.detail?.carsDestroyed === "number"
          ? customEvent.detail.carsDestroyed
          : null;
      const durationSeconds = Number(customEvent.detail?.durationSeconds ?? 90);
      const missionsCompleted = Number(customEvent.detail?.missionsCompleted ?? 0);
      const missionsTotal = Number(customEvent.detail?.missionsTotal ?? 0);
      const endTitle = customEvent.detail?.endTitle ?? "La Bestia";
      const gameOverStats = {
        score,
        maxCombo,
        carsDestroyed,
        missionsCompleted,
        missionsTotal,
        endTitle,
      };

      if (!isFirebaseConfigured || !user) {
        saveLocalScore({
          displayName: user?.displayName ?? "Jugador local",
          score,
          maxCombo,
          carsDestroyed,
          durationSeconds,
        });

        setGameOverResult({
          ...gameOverStats,
          message: isFirebaseConfigured
            ? "Partida guardada en este navegador. Inicia sesion para ranking global."
            : "Partida guardada en este navegador. Firebase todavia no esta configurado.",
        });
        return;
      }

      const result: GameRunResult = {
        uid: user.uid,
        displayName: user.displayName,
        score,
        maxCombo,
        carsDestroyed,
        durationSeconds,
      };

      try {
        await saveGameRun(result);
      } catch (unknownError) {
        console.error("No se pudo guardar la partida en scores.", unknownError);
        saveLocalScore({
          displayName: user.displayName,
          score,
          maxCombo,
          carsDestroyed,
          durationSeconds,
        });

        setGameOverResult({
          ...gameOverStats,
          message: "No se pudo guardar la partida en Firebase. Dejamos una copia local en este navegador.",
        });
        return;
      }

      try {
        await updateLeaderboard(result);
        setGameOverResult({
          ...gameOverStats,
          message: "Partida guardada y ranking actualizado.",
        });
      } catch (unknownError) {
        console.error("No se pudo actualizar leaderboard.", unknownError);
        saveLocalScore({
          displayName: user.displayName,
          score,
          maxCombo,
          carsDestroyed,
          durationSeconds,
        });

        setGameOverResult({
          ...gameOverStats,
          message: "La partida se guardo, pero no se pudo actualizar el ranking global. Dejamos una copia local.",
        });
      }
    };

    window.addEventListener("laBestia:gameOver", handleGameOver);

    return () => {
      window.removeEventListener("laBestia:gameOver", handleGameOver);
    };
  }, [user]);

  return (
    <section className="play-layout play-screen">
      <div className="play-main">
        <GameCanvas key={gameKey} />
        <div className="mobile-controls" aria-label="Controles tactiles">
          <button
            className="touch-control"
            type="button"
            aria-label="Mover izquierda"
            onContextMenu={(event) => event.preventDefault()}
            onPointerCancel={() => dispatchPlayerControl(0)}
            onPointerDown={() => dispatchPlayerControl(-1)}
            onPointerLeave={() => dispatchPlayerControl(0)}
            onPointerUp={() => dispatchPlayerControl(0)}
          >
            ←
          </button>
          <button
            className="touch-control"
            type="button"
            aria-label="Mover derecha"
            onContextMenu={(event) => event.preventDefault()}
            onPointerCancel={() => dispatchPlayerControl(0)}
            onPointerDown={() => dispatchPlayerControl(1)}
            onPointerLeave={() => dispatchPlayerControl(0)}
            onPointerUp={() => dispatchPlayerControl(0)}
          >
            →
          </button>
        </div>
        {gameOverResult ? (
          <div className="game-over-overlay">
            <GameOverPanel
              {...gameOverResult}
              onRestart={() => {
                setGameOverResult(null);
                setRankingOpen(false);
                setGameKey((currentKey) => currentKey + 1);
              }}
              onShowRanking={() => setRankingOpen(true)}
            />
          </div>
        ) : null}
        {rankingOpen ? <RankingPopup onClose={() => setRankingOpen(false)} /> : null}
      </div>
    </section>
  );
}
