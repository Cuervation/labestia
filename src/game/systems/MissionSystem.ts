import Phaser from "phaser";
import { GAME_BALANCE } from "../config/balance";
import type { CarModel, FlashMissionId, HitResult, MissionCompletion, MissionId, MissionSnapshot } from "../types";
import type { RiderKind } from "./RiderSystem";
import type { ScoringSystem } from "./ScoringSystem";

type MissionState = MissionSnapshot;
type FlashMissionConfig = (typeof GAME_BALANCE.flashMissions.list)[number];
type FlashMissionState = MissionSnapshot & {
  id: FlashMissionId;
  expiresAtMs: number;
  seenModels: Partial<Record<CarModel, boolean>>;
  rappiStarted: boolean;
};

const MISSION_IDS: MissionId[] = ["destroyCars", "comboStreak", "bestiaMode"];

export class MissionSystem {
  private readonly missions: MissionState[] = MISSION_IDS.map((id) => ({
    id,
    label: GAME_BALANCE.missions[id].label,
    progress: 0,
    target: GAME_BALANCE.missions[id].target,
    bonus: GAME_BALANCE.missions[id].bonus,
    completed: false,
  }));
  private activeFlashMission: FlashMissionState | null = null;
  private nextFlashAtMs = GAME_BALANCE.flashMissions.firstAtSeconds * 1000;
  private lastFlashId: FlashMissionId | null = null;
  private flashCompleted = 0;
  private policeBestiaHits = 0;
  private ecoDestroyed = 0;

  update(elapsedMs: number) {
    if (this.activeFlashMission) {
      this.activeFlashMission.remainingSeconds = Math.max(0, Math.ceil((this.activeFlashMission.expiresAtMs - elapsedMs) / 1000));
    }

    if (this.activeFlashMission && elapsedMs >= this.activeFlashMission.expiresAtMs) {
      this.activeFlashMission = null;
      this.nextFlashAtMs = elapsedMs + GAME_BALANCE.flashMissions.intervalMs;
    }

    if (!this.activeFlashMission && elapsedMs >= this.nextFlashAtMs) {
      this.startFlashMission(elapsedMs);
    }
  }

  registerHit(hit: HitResult, scoring: ScoringSystem): MissionCompletion[] {
    const completions: MissionCompletion[] = [];

    if (hit.carModel === "eco") {
      this.ecoDestroyed += 1;
    }
    if (hit.kind === "policeCar" && hit.bestiaModeActive) {
      this.policeBestiaHits += 1;
    }

    this.updateBaseMissions(hit, completions);
    this.updateFlashMission(hit, scoring, completions);

    return completions;
  }

  registerRider(kind: RiderKind) {
    if (kind === "gaston" && this.activeFlashMission?.id === "flashRappiCars") {
      this.activeFlashMission.rappiStarted = true;
    }
  }

  getSnapshots(): MissionSnapshot[] {
    const base = this.missions.map((mission) => ({ ...mission }));
    if (!this.activeFlashMission) {
      return base;
    }

    return [{ ...this.activeFlashMission }, ...base.slice(0, 2)];
  }

  getCompletedCount() {
    return this.missions.filter((mission) => mission.completed).length + this.flashCompleted;
  }

  getTotalCount() {
    return this.missions.length + GAME_BALANCE.flashMissions.list.length;
  }

  getEndTitle(scoring: ScoringSystem) {
    if (scoring.bestiaActivations >= 2 || this.flashCompleted >= 3) {
      return "Bestia Total";
    }
    if (this.policeBestiaHits >= 1) {
      return "Antipatrullero";
    }
    if (this.ecoDestroyed >= 3) {
      return "Rey de la Eco";
    }
    if (scoring.getBestComboBonus() >= 1200 || scoring.maxCombo >= 6) {
      return "Combo Animal";
    }
    return "Destructor Callejero";
  }

  private updateBaseMissions(hit: HitResult, completions: MissionCompletion[]) {
    this.updateMission("destroyCars", (mission) => {
      mission.progress = Math.min(mission.target, mission.progress + 1);
    }, completions);

    this.updateMission("comboStreak", (mission) => {
      mission.progress = Math.min(mission.target, Math.max(mission.progress, hit.comboMultiplier));
    }, completions);

    if (hit.bestiaActivated) {
      this.updateMission("bestiaMode", (mission) => {
        mission.progress = mission.target;
      }, completions);
    }
  }

  private updateFlashMission(hit: HitResult, scoring: ScoringSystem, completions: MissionCompletion[]) {
    const mission = this.activeFlashMission;
    if (!mission || mission.completed) {
      return;
    }

    switch (mission.id) {
      case "flashChery":
        if (hit.carModel === "chery") {
          mission.progress += 1;
        }
        break;
      case "flashFocusEco":
        if (hit.carModel === "focus" || hit.carModel === "eco") {
          mission.seenModels[hit.carModel] = true;
          mission.progress = Number(Boolean(mission.seenModels.focus)) + Number(Boolean(mission.seenModels.eco));
        }
        break;
      case "flashPoliceBestia":
        if (hit.kind === "policeCar" && hit.bestiaModeActive) {
          mission.progress = 1;
        }
        break;
      case "flashRappiCars":
        if (mission.rappiStarted && scoring.rappiActive) {
          mission.progress += 1;
        }
        break;
      case "flashCallejero":
        if (hit.bonusLabels.some((label) => label.toLowerCase().includes("combo callejero"))) {
          mission.progress = 1;
        }
        break;
    }

    mission.progress = Math.min(mission.target, mission.progress);
    if (mission.progress >= mission.target) {
      mission.completed = true;
      this.flashCompleted += 1;
      completions.push({ ...mission, bestiaCharge: GAME_BALANCE.flashMissions.bestiaCharge });
      this.activeFlashMission = null;
      this.nextFlashAtMs = scoring.elapsedSeconds * 1000 + GAME_BALANCE.flashMissions.intervalMs;
    }
  }

  private startFlashMission(elapsedMs: number) {
    const options = GAME_BALANCE.flashMissions.list.filter((mission) => mission.id !== this.lastFlashId);
    const config = Phaser.Utils.Array.GetRandom(options.length > 0 ? options : [...GAME_BALANCE.flashMissions.list]) as FlashMissionConfig;
    this.lastFlashId = config.id;
    this.activeFlashMission = {
      id: config.id,
      label: config.label,
      progress: 0,
      target: config.target,
      bonus: config.bonus,
      completed: false,
      isFlash: true,
      remainingSeconds: Math.ceil(GAME_BALANCE.flashMissions.durationMs / 1000),
      expiresAtMs: elapsedMs + GAME_BALANCE.flashMissions.durationMs,
      seenModels: {},
      rappiStarted: false,
    };
  }

  private updateMission(
    id: MissionId,
    update: (mission: MissionState) => void,
    completions: MissionCompletion[],
  ) {
    const mission = this.missions.find((current) => current.id === id);

    if (!mission || mission.completed) {
      return;
    }

    update(mission);

    if (mission.progress >= mission.target) {
      mission.completed = true;
      completions.push({ ...mission });
    }
  }
}
