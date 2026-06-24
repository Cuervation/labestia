import {
  collection,
  doc,
  getDocs,
  limit as queryLimit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db, firebaseConfigError } from "./firebaseConfig";
import type { GameRunResult, LeaderboardEntry } from "./types";

export async function updateLeaderboard(result: GameRunResult) {
  if (!db) {
    throw new Error(firebaseConfigError ?? "Firestore no esta disponible.");
  }

  const entryRef = doc(db, "leaderboard", result.uid);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(entryRef);
    const currentBest = snapshot.exists() ? Number(snapshot.data().bestScore ?? 0) : 0;

    if (!snapshot.exists() || result.score > currentBest) {
      transaction.set(
        entryRef,
        {
          uid: result.uid,
          displayName: result.displayName,
          bestScore: result.score,
          maxCombo: result.maxCombo,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }
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
      uid: String(data.uid ?? entry.id),
      displayName: String(data.displayName ?? "Jugador anonimo"),
      bestScore: Number(data.bestScore ?? 0),
      maxCombo: Number(data.maxCombo ?? 1),
      updatedAt: data.updatedAt,
    };
  });
}
