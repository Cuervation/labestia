import { GAME_BALANCE, type DifficultyLevel } from "../config/balance";
import type { CarModel, HitResult, VehicleKind } from "../types";

type SequenceCombo = {
  models: readonly CarModel[];
  bonus: number;
  label: string;
};

export class ScoringSystem {
  score = 0;
  comboCount = 0;
  maxCombo = 0;
  autosDestroyed = 0;
  bestiaModeUntil = 0;
  bestiaCharge = 0;
  bestiaActivations = 0;
  lastComboLabel = "";
  bestComboLabel = "";
  private lastHitAt = -Infinity;
  private finished = false;
  private elapsedMs = 0;
  private destroyedModels: CarModel[] = [];
  private rappiMultiplierUntil = 0;
  private pedidosYaComboUntil = 0;
  private lastSequenceSignature = "";
  private bestComboBonus = 0;

  get remainingSeconds() {
    return Math.max(0, GAME_BALANCE.durationSeconds - this.elapsedSeconds);
  }

  get elapsedSeconds() {
    return this.elapsedMs / 1000;
  }

  get bestiaModeActive() {
    return this.elapsedMs < this.bestiaModeUntil;
  }

  get rappiActive() {
    return this.elapsedMs < this.rappiMultiplierUntil;
  }

  get pedidosYaActive() {
    return this.elapsedMs < this.pedidosYaComboUntil;
  }

  get activeRiderLabel() {
    if (this.rappiActive) {
      return `RAPPI x${GAME_BALANCE.riders.rappiMultiplier} ${this.getRappiRemainingSeconds()}s`;
    }

    if (this.pedidosYaActive) {
      return "PEDIDOSYA COMBO +50%";
    }

    return "";
  }

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

  registerHit(kind: VehicleKind, carModel?: CarModel, hitY = Infinity, screenHeight = Infinity): HitResult {
    this.autosDestroyed += 1;

    if (kind === "policeCar") {
      return this.registerPoliceHit();
    }

    const model = carModel ?? "peugeot";
    const hitAtMs = this.elapsedMs;
    const insideComboWindow = hitAtMs - this.lastHitAt <= GAME_BALANCE.comboWindowMs;
    this.comboCount = insideComboWindow ? this.comboCount + 1 : 1;
    this.maxCombo = Math.max(this.maxCombo, this.comboCount);
    this.lastHitAt = hitAtMs;
    this.destroyedModels.push(model);
    this.destroyedModels = this.destroyedModels.slice(-3);

    let bestiaActivated = false;
    let bestiaChargeGain = 0;
    const bonusLabels: string[] = [];
    let bonusPoints = 0;

    const comboMultiplier = Math.min(this.comboCount, GAME_BALANCE.maxComboMultiplier);
    const scoreMultiplier = this.getScoreMultiplier();
    const points = Math.round(GAME_BALANCE.score[model] * comboMultiplier * scoreMultiplier);

    const sequenceCombo = this.matchSequenceCombo();
    if (sequenceCombo) {
      const sequenceBonus = this.applyPedidosYaBonus(sequenceCombo.bonus);
      bonusPoints += sequenceBonus;
      bonusLabels.push(`${sequenceCombo.label} +${sequenceBonus}`);
      this.setComboLabel(`${sequenceCombo.label} +${sequenceBonus}`);
      bestiaActivated = this.addBestiaCharge(GAME_BALANCE.bestiaCharge.sequenceCombo) || bestiaActivated;
    } else {
      this.lastSequenceSignature = "";
    }

    if (model === "meriva" && this.comboCount >= 3) {
      bonusPoints += GAME_BALANCE.modelBonuses.merivaCombo;
      bonusLabels.push(`Meriva pesada +${GAME_BALANCE.modelBonuses.merivaCombo}`);
    }

    if (model === "focus" && hitY <= screenHeight / 2) {
      bonusPoints += GAME_BALANCE.modelBonuses.focusEarly;
      bonusLabels.push(`Focus rapido +${GAME_BALANCE.modelBonuses.focusEarly}`);
    }

    if (model === "eco") {
      bestiaChargeGain += GAME_BALANCE.bestiaCharge.ecoHit;
      bestiaActivated = this.addBestiaCharge(GAME_BALANCE.bestiaCharge.ecoHit) || bestiaActivated;
    }

    if (this.bestiaModeActive) {
      this.extendBestiaMode();
    }

    this.score += points + bonusPoints;

    return {
      kind,
      carModel: model,
      points,
      comboMultiplier,
      bonusPoints,
      bonusLabels,
      bestiaActivated,
      bestiaModeActive: this.bestiaModeActive,
      policePunished: false,
      bestiaChargeGain,
    };
  }

  addBonus(points: number) {
    this.score += points;
  }

  addBestiaChargeBonus(amount: number) {
    return this.addBestiaCharge(amount);
  }

  activateRappi() {
    this.rappiMultiplierUntil = this.elapsedMs + GAME_BALANCE.riders.rappiDurationMs;
  }

  activatePedidosYa() {
    this.pedidosYaComboUntil = this.elapsedMs + GAME_BALANCE.riders.pedidosYaDurationMs;
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

  private getRappiRemainingSeconds() {
    return Math.ceil(Math.max(0, this.rappiMultiplierUntil - this.elapsedMs) / 1000);
  }

  getBestiaChargeRatio() {
    return this.bestiaModeActive ? 1 : this.bestiaCharge / GAME_BALANCE.bestiaChargeMax;
  }

  getBestComboBonus() {
    return this.bestComboBonus;
  }

  getPlayerSpeedMultiplier() {
    return this.bestiaModeActive ? GAME_BALANCE.bestiaModeSpeedMultiplier : 1;
  }

  private registerPoliceHit(): HitResult {
    if (this.bestiaModeActive) {
      const points = GAME_BALANCE.score.policeBestia;
      this.extendBestiaMode();
      this.score += points;
      return {
        kind: "policeCar",
        points,
        comboMultiplier: Math.max(this.comboCount, 1),
        bonusPoints: 0,
        bonusLabels: [],
        bestiaActivated: false,
        bestiaModeActive: true,
        policePunished: false,
        bestiaChargeGain: 0,
      };
    }

    this.comboCount = 0;
    this.lastHitAt = -Infinity;
    this.destroyedModels = [];
    this.lastSequenceSignature = "";
    const points = GAME_BALANCE.score.policeCar;
    this.score += points;

    return {
      kind: "policeCar",
      points,
      comboMultiplier: 1,
      bonusPoints: 0,
      bonusLabels: [],
      bestiaActivated: false,
      bestiaModeActive: false,
      policePunished: true,
      bestiaChargeGain: 0,
    };
  }

  private matchSequenceCombo(): SequenceCombo | null {
    const combos = GAME_BALANCE.sequenceCombos as readonly SequenceCombo[];

    return combos.find((combo) => {
      if (combo.models.length > this.destroyedModels.length) {
        return false;
      }

      const tail = this.destroyedModels.slice(-combo.models.length);
      const signature = `${combo.label}:${tail.join(">")}`;
      return signature !== this.lastSequenceSignature && combo.models.every((model, index) => tail[index] === model);
    }) ?? null;
  }

  private addBestiaCharge(amount: number) {
    if (this.bestiaModeActive) {
      return false;
    }

    this.bestiaCharge = Math.min(GAME_BALANCE.bestiaChargeMax, this.bestiaCharge + amount);
    if (this.bestiaCharge < GAME_BALANCE.bestiaChargeMax) {
      return false;
    }

    this.bestiaCharge = 0;
    this.bestiaModeUntil = this.elapsedMs + GAME_BALANCE.bestiaModeDurationMs;
    this.bestiaActivations += 1;
    return true;
  }

  private extendBestiaMode() {
    this.bestiaModeUntil = Math.min(
      this.elapsedMs + GAME_BALANCE.bestiaModeMaxDurationMs,
      this.bestiaModeUntil + GAME_BALANCE.bestiaModeHitExtendMs,
    );
  }

  private getScoreMultiplier() {
    const bestiaMultiplier = this.bestiaModeActive ? GAME_BALANCE.bestiaModeScoreMultiplier : 1;
    const riderMultiplier = this.rappiActive ? GAME_BALANCE.riders.rappiMultiplier : 1;
    return bestiaMultiplier * riderMultiplier;
  }

  private applyPedidosYaBonus(bonus: number) {
    return this.pedidosYaActive ? Math.round(bonus * GAME_BALANCE.riders.pedidosYaBonusMultiplier) : bonus;
  }

  private setComboLabel(label: string) {
    this.lastComboLabel = label;
    const bonus = Number(label.match(/\+(\d+)/)?.[1] ?? 0);
    if (bonus >= this.bestComboBonus) {
      this.bestComboBonus = bonus;
      this.bestComboLabel = label;
    }
    this.lastSequenceSignature = `${label.replace(/ \+\d+$/, "")}:${this.destroyedModels.join(">")}`;
  }
}
