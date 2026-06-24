import { useEffect, useState } from "react";
import { getTopLeaderboard } from "../firebase";
import type { LeaderboardEntry } from "../firebase";

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getTopLeaderboard(20)
      .then((results) => {
        if (!cancelled) {
          setEntries(results);
          setError(null);
        }
      })
      .catch((unknownError: unknown) => {
        const message =
          unknownError instanceof Error ? unknownError.message : "No se pudo cargar el ranking.";

        if (!cancelled) {
          setError(message);
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
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="panel">
        <p>Todavia no hay puntajes guardados.</p>
      </div>
    );
  }

  return (
    <div className="table-shell panel">
      <table className="arcade-table">
        <thead>
          <tr>
            <th>Pos.</th>
            <th>Jugador</th>
            <th>Puntaje</th>
            <th>Combo max</th>
            <th>Autos destruidos</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr key={entry.uid}>
              <td>{index + 1}</td>
              <td>{entry.displayName}</td>
              <td>{entry.bestScore}</td>
              <td>x{entry.maxCombo}</td>
              <td>—</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
