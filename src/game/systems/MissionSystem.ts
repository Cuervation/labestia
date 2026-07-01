import { GAME_BALANCE } from "../config/balance";
import type { SuperJackpotHitResult, SuperJackpotSnapshot } from "../types";
import type { ScoringSystem } from "./ScoringSystem";

export class MissionSystem {
  private active = true;
  private progress = 0;
  private bonusHits = 0;
  private awardedScore = 0;

  update(remainingSeconds: number) {
    this.active = remainingSeconds <= GAME_BALANCE.superJackpot.startsAtRemainingSeconds;
  }

  registerHit(scoring: ScoringSystem, countsTowardTarget: boolean): SuperJackpotHitResult {
    if (!this.active) {
      return {
        status: "inactive",
        snapshot: this.getSnapshot(),
        awardedScore: 0,
      };
    }

    if (!countsTowardTarget) {
      return {
        status: "inactive",
        snapshot: this.getSnapshot(),
        awardedScore: 0,
      };
    }

    this.progress += 1;

    if (this.progress <= GAME_BALANCE.superJackpot.targetCars) {
      return {
        status: "progress",
        snapshot: this.getSnapshot(),
        awardedScore: 0,
      };
    }

    this.bonusHits += 1;
    const multiplier = GAME_BALANCE.superJackpot.scoreMultiplier + this.bonusHits - 1;
    this.awardedScore = scoring.multiplyScore(multiplier);

    return {
      status: "bonus",
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
    return this.progress > GAME_BALANCE.superJackpot.targetCars;
  }

  getRemainingTargets() {
    return Math.max(0, GAME_BALANCE.superJackpot.targetCars - this.progress);
  }

  getCompletedCount() {
    return this.bonusHits;
  }

  getTotalCount() {
    return Math.max(1, this.progress);
  }

  getEndTitle() {
    return this.progress > GAME_BALANCE.superJackpot.targetCars ? "SuperJackpot" : "La Bestia";
  }

  private getSnapshot(): SuperJackpotSnapshot {
    return {
      id: "super-jackpot",
      label: "SUPERJACKPOT",
      progress: this.progress,
      target: GAME_BALANCE.superJackpot.targetCars,
      multiplier: GAME_BALANCE.superJackpot.scoreMultiplier,
      active: this.active,
      completed: this.progress > GAME_BALANCE.superJackpot.targetCars,
      subtotal: this.awardedScore,
    };
  }
}
