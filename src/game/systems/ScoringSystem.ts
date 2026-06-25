import { GAME_BALANCE, type DifficultyLevel } from "../config/balance";
import type { HitResult, VehicleKind } from "../types";

export class ScoringSystem {
  score = 0;
  comboCount = 0;
  maxCombo = 0;
  autosDestroyed = 0;
  bestiaModeUntil = 0;
  private lastHitAt = -Infinity;
  private finished = false;

  get remainingSeconds() {
    return Math.max(0, GAME_BALANCE.durationSeconds - this.elapsedSeconds);
  }

  get elapsedSeconds() {
    return this.elapsedMs / 1000;
  }

  get bestiaModeActive() {
    return this.elapsedMs < this.bestiaModeUntil;
  }

  private elapsedMs = 0;

  update(deltaMs: number) {
    if (this.finished) {
      return;
    }

    this.elapsedMs += deltaMs;

    if (this.elapsedMs - this.lastHitAt > GAME_BALANCE.comboWindowMs) {
      this.comboCount = 0;
    }

    if (this.remainingSeconds <= 0) {
      this.finished = true;
    }
  }

  registerHit(kind: VehicleKind): HitResult {
    const hitAtMs = this.elapsedMs;
    const insideComboWindow = hitAtMs - this.lastHitAt <= GAME_BALANCE.comboWindowMs;
    this.comboCount = insideComboWindow ? this.comboCount + 1 : 1;
    this.maxCombo = Math.max(this.maxCombo, this.comboCount);
    this.lastHitAt = hitAtMs;
    this.autosDestroyed += 1;

    let bestiaActivated = false;
    if (this.comboCount >= GAME_BALANCE.bestiaModeComboThreshold && !this.bestiaModeActive) {
      this.bestiaModeUntil = this.elapsedMs + GAME_BALANCE.bestiaModeDurationMs;
      bestiaActivated = true;
    }

    const comboMultiplier = Math.min(this.comboCount, GAME_BALANCE.maxComboMultiplier);
    const bestiaMultiplier = this.bestiaModeActive ? GAME_BALANCE.bestiaModeScoreMultiplier : 1;
    const baseScore = GAME_BALANCE.score[kind];
    const points = baseScore * comboMultiplier * bestiaMultiplier;
    this.score += points;

    return {
      kind,
      points,
      comboMultiplier,
      bestiaActivated,
      bestiaModeActive: this.bestiaModeActive,
    };
  }

  addBonus(points: number) {
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

  getBestiaRemainingSeconds() {
    if (!this.bestiaModeActive) {
      return 0;
    }

    return Math.ceil((this.bestiaModeUntil - this.elapsedMs) / 1000);
  }

  getPlayerSpeedMultiplier() {
    return this.bestiaModeActive ? GAME_BALANCE.bestiaModeSpeedMultiplier : 1;
  }
}
