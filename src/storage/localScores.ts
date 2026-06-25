export type LocalScoreInput = {
  displayName?: string;
  score: number;
  maxCombo: number;
  carsDestroyed?: number | null;
  durationSeconds: number;
};

export type LocalLeaderboardEntry = {
  id: string;
  displayName: string;
  bestScore: number;
  maxCombo: number;
  carsDestroyed: number | null;
  durationSeconds: number;
  createdAt: string;
};

const STORAGE_KEY = "laBestia.localScores.v1";
const LOCAL_LIMIT = 20;

export function saveLocalScore(input: LocalScoreInput) {
  const entry: LocalLeaderboardEntry = {
    id: createLocalId(),
    displayName: input.displayName?.trim() || "Jugador local",
    bestScore: Math.max(0, Math.round(input.score)),
    maxCombo: Math.max(1, Math.round(input.maxCombo)),
    carsDestroyed: typeof input.carsDestroyed === "number" ? Math.max(0, Math.round(input.carsDestroyed)) : null,
    durationSeconds: Math.max(0, Math.round(input.durationSeconds)),
    createdAt: new Date().toISOString(),
  };

  const entries = [...readLocalScores(), entry]
    .sort(compareScores)
    .slice(0, LOCAL_LIMIT);

  writeLocalScores(entries);
  return entry;
}

export function getLocalLeaderboard(limit = LOCAL_LIMIT): LocalLeaderboardEntry[] {
  return readLocalScores().sort(compareScores).slice(0, limit);
}

export function clearLocalLeaderboard() {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

function readLocalScores(): LocalLeaderboardEntry[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(normalizeEntry)
      .filter((entry): entry is LocalLeaderboardEntry => entry !== null)
      .slice(0, LOCAL_LIMIT);
  } catch {
    return [];
  }
}

function writeLocalScores(entries: LocalLeaderboardEntry[]) {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Si el navegador bloquea localStorage, el juego sigue funcionando.
  }
}

function normalizeEntry(value: unknown): LocalLeaderboardEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<LocalLeaderboardEntry>;
  const bestScore = Number(candidate.bestScore);
  const maxCombo = Number(candidate.maxCombo);
  const durationSeconds = Number(candidate.durationSeconds);

  if (!Number.isFinite(bestScore) || !Number.isFinite(maxCombo)) {
    return null;
  }

  return {
    id: String(candidate.id ?? createLocalId()),
    displayName: String(candidate.displayName ?? "Jugador local"),
    bestScore,
    maxCombo,
    carsDestroyed: typeof candidate.carsDestroyed === "number" ? candidate.carsDestroyed : null,
    durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : 0,
    createdAt: String(candidate.createdAt ?? new Date().toISOString()),
  };
}

function compareScores(a: LocalLeaderboardEntry, b: LocalLeaderboardEntry) {
  if (b.bestScore !== a.bestScore) {
    return b.bestScore - a.bestScore;
  }

  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function createLocalId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}
