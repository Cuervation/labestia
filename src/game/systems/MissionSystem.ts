import { GAME_BALANCE } from "../config/balance";
import type { CarModel, MissionHitResult, MissionSnapshot } from "../types";
import type { ScoringSystem } from "./ScoringSystem";

type MissionConfig = (typeof GAME_BALANCE.missionScoring.missions)[number];

export class MissionSystem {
  private activeMission: MissionConfig;
  private previousMissionId: string | null = null;
  private progress = 0;
  private subtotal = 0;
  private completedCount = 0;

  constructor() {
    this.activeMission = this.pickMission();
  }

  registerHit(carModel: CarModel | undefined, scoring: ScoringSystem): MissionHitResult {
    if (carModel !== this.activeMission.model) {
      return {
        status: "nonTarget",
        mission: this.getSnapshot(),
        expectedModel: this.activeMission.model,
        actualModel: carModel,
        basePoints: carModel ? GAME_BALANCE.score[carModel] : undefined,
        awardedScore: 0,
      };
    }

    const basePoints = GAME_BALANCE.score[carModel];
    this.progress += 1;
    this.subtotal += basePoints;

    if (this.progress < this.activeMission.target) {
      return {
        status: "correct",
        mission: this.getSnapshot(),
        expectedModel: this.activeMission.model,
        actualModel: carModel,
        basePoints,
        awardedScore: 0,
      };
    }

    const completedMission = this.getSnapshot();
    const awardedScore = this.subtotal * GAME_BALANCE.missionScoring.completionMultiplier;
    scoring.addMissionScore(awardedScore);
    this.completedCount += 1;
    this.previousMissionId = this.activeMission.id;
    this.activeMission = this.pickMission(this.previousMissionId);
    this.progress = 0;
    this.subtotal = 0;

    return {
      status: "completed",
      mission: completedMission,
      expectedModel: completedMission.expectedModel,
      actualModel: carModel,
      basePoints,
      awardedScore,
    };
  }

  getSnapshots(): MissionSnapshot[] {
    return [this.getSnapshot()];
  }

  getCompletedCount() {
    return this.completedCount;
  }

  getTotalCount() {
    return GAME_BALANCE.missionScoring.missions.length;
  }

  getEndTitle() {
    if (this.completedCount >= 5) {
      return "Misionero perfecto";
    }
    if (this.completedCount >= 2) {
      return "Cadena callejera";
    }
    return "La Bestia";
  }

  private getSnapshot(): MissionSnapshot {
    return {
      id: this.activeMission.id,
      label: this.activeMission.label,
      progress: this.progress,
      target: this.activeMission.target,
      multiplier: GAME_BALANCE.missionScoring.completionMultiplier,
      expectedModel: this.activeMission.model,
      subtotal: this.subtotal,
    };
  }

  private pickMission(excludeId?: string) {
    const missions = GAME_BALANCE.missionScoring.missions;
    const options = excludeId ? missions.filter((mission) => mission.id !== excludeId) : missions;
    const pool = options.length > 0 ? options : missions;
    return pool[Math.floor(Math.random() * pool.length)];
  }
}
