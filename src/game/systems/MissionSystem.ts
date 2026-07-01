import { GAME_BALANCE } from "../config/balance";
import type { SuperJackpotHitResult, SuperJackpotSnapshot } from "../types";
import type { ScoringSystem } from "./ScoringSystem";

export class MissionSystem {
  private active = false;
  private completed = false;
  private progress = 0;
  private awardedScore = 0;

  update(remainingSeconds: number) {
    if (this.active) {
      return;
    }

    this.active = remainingSeconds <= GAME_BALANCE.superJackpot.startsAtRemainingSeconds;
  }

  registerHit(scoring: ScoringSystem): SuperJackpotHitResult {
    if (!this.active || this.completed) {
      return {
        status: "inactive",
        snapshot: this.getSnapshot(),
        awardedScore: 0,
      };
    }

    this.progress = Math.min(this.progress + 1, GAME_BALANCE.superJackpot.targetCars);

    if (this.progress < GAME_BALANCE.superJackpot.targetCars) {
      return {
        status: "progress",
        snapshot: this.getSnapshot(),
        awardedScore: 0,
      };
    }

    this.completed = true;
    this.awardedScore = scoring.multiplyScore(GAME_BALANCE.superJackpot.scoreMultiplier);

    return {
      status: "completed",
      snapshot: this.getSnapshot(),
      awardedScore: this.awardedScore,
    };
  }

  getSnapshots(): SuperJackpotSnapshot[] {
    return [this.getSnapshot()];
  }

  isActive() {
    return this.active;
  }

  isCompleted() {
    return this.completed;
  }

  getRemainingTargets() {
    return Math.max(0, GAME_BALANCE.superJackpot.targetCars - this.progress);
  }

  getCompletedCount() {
    return this.completed ? 1 : 0;
  }

  getTotalCount() {
    return 1;
  }

  getEndTitle() {
    return this.completed ? "SuperJackpot" : "La Bestia";
  }

  private getSnapshot(): SuperJackpotSnapshot {
    return {
      id: "super-jackpot",
      label: this.active ? "SUPERJACKPOT" : "SUPERJACKPOT EN 0:20",
      progress: this.progress,
      target: GAME_BALANCE.superJackpot.targetCars,
      multiplier: GAME_BALANCE.superJackpot.scoreMultiplier,
      active: this.active,
      completed: this.completed,
      subtotal: this.awardedScore,
    };
  }
}
