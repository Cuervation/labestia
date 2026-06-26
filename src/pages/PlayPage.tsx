import { useEffect, useState } from "react";
import { GameCanvas, GameOverPanel } from "../components";
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
};

function dispatchPlayerControl(direction: -1 | 0 | 1) {
  window.dispatchEvent(new CustomEvent("laBestia:playerControl", { detail: { direction } }));
}

export function PlayPage() {
  const user = useAuthStore((state) => state.user);
  const [gameKey, setGameKey] = useState(0);
  const [gameOverResult, setGameOverResult] = useState<{
    score: number;
    maxCombo: number;
    carsDestroyed?: number | null;
    missionsCompleted?: number;
    missionsTotal?: number;
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

      if (!isFirebaseConfigured || !user) {
        saveLocalScore({
          displayName: user?.displayName ?? "Jugador local",
          score,
          maxCombo,
          carsDestroyed,
          durationSeconds,
        });

        setGameOverResult({
          score,
          maxCombo,
          carsDestroyed,
          missionsCompleted,
          missionsTotal,
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
        await updateLeaderboard(result);
        setGameOverResult({
          score,
          maxCombo,
          carsDestroyed,
          missionsCompleted,
          missionsTotal,
          message: "Partida guardada y ranking actualizado.",
        });
      } catch {
        saveLocalScore({
          displayName: user.displayName,
          score,
          maxCombo,
          carsDestroyed,
          durationSeconds,
        });

        setGameOverResult({
          score,
          maxCombo,
          carsDestroyed,
          missionsCompleted,
          missionsTotal,
          message: "No se pudo guardar en Firebase. Dejamos una copia local en este navegador.",
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
                setGameKey((currentKey) => currentKey + 1);
              }}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
