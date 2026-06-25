export type GameSessionState = "countdown" | "running" | "finished";

export type VehicleKind = "normalCar" | "taxi" | "van" | "policeCar";

export type MissionId = "destroyCars" | "comboStreak" | "bestiaMode";

export type MissionSnapshot = {
  id: MissionId;
  label: string;
  progress: number;
  target: number;
  bonus: number;
  completed: boolean;
};

export type MissionCompletion = MissionSnapshot & {
  bonus: number;
};

export type HitResult = {
  kind: VehicleKind;
  points: number;
  comboMultiplier: number;
  bestiaActivated: boolean;
  bestiaModeActive: boolean;
};

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
    webkitAudioContext?: typeof AudioContext;
  }
}
