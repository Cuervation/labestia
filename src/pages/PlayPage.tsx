import { useEffect, useState } from "react";
import { GameCanvas, GameOverPanel, LoginButton } from "../components";
import { saveGameRun, updateLeaderboard } from "../firebase";
import type { GameRunResult } from "../firebase";
import { useAuthStore } from "../store";

type GameOverEventDetail = {
  score?: number;
  maxCombo?: number;
  autosDestroyed?: number;
};

export function PlayPage() {
  const user = useAuthStore((state) => state.user);
  const [gameOverResult, setGameOverResult] = useState<{
    score: number;
    maxCombo: number;
    autosDestroyed?: number | null;
    message: string;
  } | null>(null);

  useEffect(() => {
    const handleGameOver = async (event: Event) => {
      const customEvent = event as CustomEvent<GameOverEventDetail>;
      const score = Number(customEvent.detail?.score ?? 0);
      const maxCombo = Number(customEvent.detail?.maxCombo ?? 1);
      const autosDestroyed =
        typeof customEvent.detail?.autosDestroyed === "number"
          ? customEvent.detail.autosDestroyed
          : null;

      if (!user) {
        setGameOverResult({
          score,
          maxCombo,
          autosDestroyed,
          message: "Jugaste sin login. El puntaje no se guardo.",
        });
        return;
      }

      const result: GameRunResult = {
        uid: user.uid,
        displayName: user.displayName,
        score,
        maxCombo,
        durationSeconds: 90,
      };

      try {
        await saveGameRun(result);
        await updateLeaderboard(result);
        setGameOverResult({
          score,
          maxCombo,
          autosDestroyed,
          message: "Partida guardada y ranking actualizado.",
        });
      } catch (unknownError) {
        const message =
          unknownError instanceof Error ? unknownError.message : "No se pudo guardar la partida.";

        setGameOverResult({
          score,
          maxCombo,
          autosDestroyed,
          message,
        });
      }
    };

    window.addEventListener("laBestia:gameOver", handleGameOver);

    return () => {
      window.removeEventListener("laBestia:gameOver", handleGameOver);
    };
  }, [user]);

  return (
    <section className="play-layout">
      <div className="play-main">
        <div className="page-heading">
          <span className="eyebrow">Modo arcade</span>
          <h1>Jugar</h1>
          <p>Canvas Phaser centrado. Firebase y UI viven afuera del juego.</p>
        </div>
        <GameCanvas />
      </div>

      <aside className="play-sidebar panel">
        <h2>Cabina</h2>
        <p>{user ? `Jugador: ${user.displayName}` : "Sin login. Podes jugar igual."}</p>
        <p>
          Ultimo score: <strong>{gameOverResult ? gameOverResult.score : "—"}</strong>
        </p>
        <p>
          Estado: <strong>{user ? "Guardado disponible" : "Solo practica"}</strong>
        </p>
        <div className="sidebar-actions">
          <a className="secondary-link" href="/">Volver</a>
          <LoginButton />
        </div>
      </aside>

      {gameOverResult ? <GameOverPanel {...gameOverResult} /> : null}
    </section>
  );
}
