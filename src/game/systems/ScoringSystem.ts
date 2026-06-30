import { GAME_BALANCE, type DifficultyLevel } from "../config/balance";
import type { CarModel } from "../types";

export class ScoringSystem {
  score = 0;
  maxCombo = 0;
  autosDestroyed = 0;
  private finished = false;
  private elapsedMs = 0;
  private startedAtMs: number | null = null;

  get remainingSeconds() {
    return Math.max(0, GAME_BALANCE.durationSeconds - this.elapsedSeconds);
  }

  get elapsedSeconds() {
    return this.elapsedMs / 1000;
  }

  get started() {
    return this.startedAtMs !== null;
  }

  start(nowMs = performance.now()) {
    if (this.startedAtMs !== null) {
      return;
    }

    this.startedAtMs = nowMs;
    this.elapsedMs = 0;
  }

  update(nowMs = performance.now()) {
    if (this.finished) {
      return;
    }

    if (this.startedAtMs === null) {
      return;
    }

    this.elapsedMs = Math.max(0, nowMs - this.startedAtMs);

    if (this.remainingSeconds <= 0) {
      this.finished = true;
    }
  }

  registerVehicleDestroyed() {
    this.autosDestroyed += 1;
  }

  addVehicleBaseScore(carModel: CarModel) {
    const points = GAME_BALANCE.score[carModel];
    this.score += points;
    return points;
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
