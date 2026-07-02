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
  const [tutorialOpen, setTutorialOpen] = useState(true);
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
        {tutorialOpen ? (
          <div className="tutorial-popup-backdrop" role="dialog" aria-modal="true" aria-label="Tutorial">
            <div className="tutorial-popup">
              <div className="tutorial-popup-header">
                <span className="mode-badge">Tutorial</span>
                <h1>Antes de salir</h1>
              </div>
              <div className="tutorial-rules">
                <article className="tutorial-rule tutorial-rule--wide">
                  <img src="/assets/peugeot.png" alt="" />
                  <p>Chocá todos los autos posibles para llegar al Superjackpot!</p>
                </article>
                <article className="tutorial-rule">
                  <img src="/assets/police-car.png" alt="" />
                  <p>Tené cuidado con chocar a la policía: te van a seguir de cerca y no vas a poder doblar.</p>
                </article>
                <article className="tutorial-rule">
                  <span className="tutorial-riders" aria-hidden="true">
                    <img src="/assets/rider_osky.png" alt="" />
                    <img src="/assets/rider_gaston.png" alt="" />
                  </span>
                  <p>Si levantás a Osky o al Negrito, acelerá que tenés que entregar el pedido con ellos.</p>
                </article>
                <article className="tutorial-rule tutorial-rule--wide">
                  <img src="/assets/mujer.png" alt="" />
                  <p>Guardá con que aparezca una chica voluptuosa: el conductor se distrae (dobla para el otro lado donde querés ir).</p>
                </article>
              </div>
              <button className="tutorial-ok-button" type="button" onClick={() => setTutorialOpen(false)}>
                OK
              </button>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
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
