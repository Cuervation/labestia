import { GAME_BALANCE } from "../config/balance";
import type { HitResult, MissionCompletion, MissionId, MissionSnapshot } from "../types";

type MissionState = MissionSnapshot;

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

  registerHit(hit: HitResult): MissionCompletion[] {
    const completions: MissionCompletion[] = [];

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

    return completions;
  }

  getSnapshots(): MissionSnapshot[] {
    return this.missions.map((mission) => ({ ...mission }));
  }

  getCompletedCount() {
    return this.missions.filter((mission) => mission.completed).length;
  }

  getTotalCount() {
    return this.missions.length;
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
