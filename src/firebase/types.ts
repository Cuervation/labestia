export type FirebaseUserProfile = {
  uid: string;
  displayName: string;
  photoURL: string | null;
};

export type GameRunResult = {
  uid: string;
  displayName: string;
  score: number;
  maxCombo: number;
  carsDestroyed?: number | null;
  durationSeconds: number;
};

export type LeaderboardEntry = {
  uid: string;
  displayName: string;
  bestScore: number;
  maxCombo: number;
  carsDestroyed?: number | null;
  updatedAt?: unknown;
};
