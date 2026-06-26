import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, firebaseConfigError } from "./firebaseConfig";
import type { GameRunResult } from "./types";

export async function saveGameRun(result: GameRunResult) {
  if (!db) {
    throw new Error(firebaseConfigError ?? "Firestore no esta disponible.");
  }

  return addDoc(collection(db, "scores"), {
    uid: result.uid,
    displayName: result.displayName,
    score: result.score,
    maxCombo: result.maxCombo,
    carsDestroyed: result.carsDestroyed ?? null,
    durationSeconds: result.durationSeconds,
    createdAt: serverTimestamp(),
  });
}
