export const GAME_BALANCE = {
  durationSeconds: 90,
  comboWindowMs: 2000,
  baseComboMultiplier: 1,
  maxComboMultiplier: 8,
  bestiaModeComboThreshold: 8,
  bestiaModeDurationMs: 8000,
  bestiaModeScoreMultiplier: 2,
  bestiaModeSpeedMultiplier: 1.35,
  policeSpawnAfterSeconds: 30,
  policeSlowDurationMs: 2200,
  policeSlowMultiplier: 0.55,
  score: {
    normalCar: 100,
    taxi: 120,
    van: 150,
    policeCar: 250,
  },
  player: {
    baseSpeed: 280,
    spriteScale: 0.42,
    width: 76,
    height: 132,
  },
  traffic: {
    carWidth: 66,
    carHeight: 126,
    explosionSize: 92,
    lanes: [180, 340, 500, 660, 820, 980, 1140],
    easy: {
      spawnEveryMs: 950,
      minSpeed: 170,
      maxSpeed: 240,
      policeChance: 0,
    },
    medium: {
      spawnEveryMs: 720,
      minSpeed: 230,
      maxSpeed: 320,
      policeChance: 0.18,
    },
    chaos: {
      spawnEveryMs: 470,
      minSpeed: 320,
      maxSpeed: 460,
      policeChance: 0.32,
    },
  },
} as const;

export type DifficultyLevel = "easy" | "medium" | "chaos";
