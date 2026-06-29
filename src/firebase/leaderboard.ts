import {
  addDoc,
  collection,
  getDocs,
  limit as queryLimit,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db, firebaseConfigError } from "./firebaseConfig";
import type { GameRunResult, LeaderboardEntry } from "./types";

export async function updateLeaderboard(result: GameRunResult) {
  if (!db) {
    throw new Error(firebaseConfigError ?? "Firestore no esta disponible.");
  }

  await addDoc(collection(db, "leaderboard"), {
    uid: result.uid,
    displayName: result.displayName,
    bestScore: result.score,
    maxCombo: result.maxCombo,
    carsDestroyed: result.carsDestroyed ?? null,
    updatedAt: serverTimestamp(),
  });
}

export async function getTopLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  if (!db) {
    throw new Error(firebaseConfigError ?? "Firestore no esta disponible.");
  }

  const leaderboardQuery = query(
    collection(db, "leaderboard"),
    orderBy("bestScore", "desc"),
    queryLimit(limit),
  );

  const snapshot = await getDocs(leaderboardQuery);

  return snapshot.docs.map((entry) => {
    const data = entry.data();

    return {
      id: entry.id,
      uid: String(data.uid ?? entry.id),
      displayName: String(data.displayName ?? "Jugador anonimo"),
      bestScore: Number(data.bestScore ?? 0),
      maxCombo: Number(data.maxCombo ?? 1),
      carsDestroyed: typeof data.carsDestroyed === "number" ? Number(data.carsDestroyed) : null,
      updatedAt: data.updatedAt,
    };
  });
}
