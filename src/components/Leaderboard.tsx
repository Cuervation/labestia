import { useEffect, useState } from "react";
import { getTopLeaderboard, isFirebaseConfigured } from "../firebase";
import { getLocalLeaderboard } from "../storage/localScores";

type LeaderboardMode = "global" | "local" | "local-fallback";

type LeaderboardRow = {
  id: string;
  displayName: string;
  bestScore: number;
  maxCombo: number;
  carsDestroyed?: number | null;
};

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<LeaderboardMode>(isFirebaseConfigured ? "global" : "local");

  useEffect(() => {
    let cancelled = false;

    if (!isFirebaseConfigured) {
      setEntries(getLocalLeaderboard(20).map(mapLocalEntry));
      setMode("local");
      setError(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    void getTopLeaderboard(20)
      .then((results) => {
        if (!cancelled) {
          setEntries(
            results.map((entry) => ({
              id: entry.uid,
              displayName: entry.displayName,
              bestScore: entry.bestScore,
              maxCombo: entry.maxCombo,
              carsDestroyed: entry.carsDestroyed,
            })),
          );
          setMode("global");
          setError(null);
        }
      })
      .catch((unknownError: unknown) => {
        const message =
          unknownError instanceof Error
            ? unknownError.message
            : "No se pudo cargar el ranking global. Probamos con tu ranking local.";
        const localEntries = getLocalLeaderboard(20).map(mapLocalEntry);

        if (!cancelled) {
          setEntries(localEntries);
          setMode("local-fallback");
          setError(localEntries.length > 0 ? null : "No se pudo cargar el ranking global y todavia no hay datos locales.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="panel">
        <p>Cargando ranking...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel">
        <p>{error}</p>
        <p className="mode-badge">No hay ranking local guardado todavia.</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="panel">
        <p>{mode === "global" ? "Todavia no hay puntajes globales." : "Todavia no hay puntajes locales."}</p>
        <p className="mode-badge">{getModeLabel(mode)}</p>
      </div>
    );
  }

  return (
    <div className="table-shell panel">
      <div className="leaderboard-status">
        <span className="mode-badge">{getModeLabel(mode)}</span>
        {mode !== "global" ? <p>Este ranking vive solo en este navegador.</p> : null}
      </div>
      <table className="arcade-table">
        <thead>
          <tr>
            <th>Pos.</th>
            <th>Jugador</th>
            <th>Puntaje</th>
            <th>Combo max</th>
            <th>Autos</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr key={entry.id}>
              <td>{index + 1}</td>
              <td>{entry.displayName}</td>
              <td>{entry.bestScore}</td>
              <td>x{entry.maxCombo}</td>
              <td>{entry.carsDestroyed ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function mapLocalEntry(entry: ReturnType<typeof getLocalLeaderboard>[number]): LeaderboardRow {
  return {
    id: entry.id,
    displayName: entry.displayName,
    bestScore: entry.bestScore,
    maxCombo: entry.maxCombo,
    carsDestroyed: entry.carsDestroyed,
  };
}

function getModeLabel(mode: LeaderboardMode) {
  if (mode === "global") {
    return "Ranking global";
  }

  if (mode === "local-fallback") {
    return "Ranking local (fallback)";
  }

  return "Ranking local";
}
