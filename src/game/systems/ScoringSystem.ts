import { GAME_BALANCE, type DifficultyLevel } from "../config/balance";

export class ScoringSystem {
  score = 0;
  maxCombo = 0;
  autosDestroyed = 0;
  private finished = false;
  private elapsedMs = 0;

  get remainingSeconds() {
    return Math.max(0, GAME_BALANCE.durationSeconds - this.elapsedSeconds);
  }

  get elapsedSeconds() {
    return this.elapsedMs / 1000;
  }

  update(deltaMs: number) {
    if (this.finished) {
      return;
    }

    this.elapsedMs += deltaMs;

    if (this.remainingSeconds <= 0) {
      this.finished = true;
    }
  }

  registerVehicleDestroyed() {
    this.autosDestroyed += 1;
  }

  addMissionScore(points: number) {
    this.score += points;
  }

  getDifficulty(): DifficultyLevel {
    if (this.elapsedSeconds < GAME_BALANCE.difficulty.mediumAfterSeconds) {
      return "easy";
    }
    if (this.elapsedSeconds < GAME_BALANCE.difficulty.chaosAfterSeconds) {
      return "medium";
    }
    return "chaos";
  }

  isFinished() {
    return this.finished;
  }
}
