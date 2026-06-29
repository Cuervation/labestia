export type GameSessionState = "countdown" | "running" | "finished";

export type VehicleKind = "normalCar" | "taxi" | "van" | "policeCar";
export type CarModel = "peugeot" | "chery" | "meriva" | "focus" | "eco";

export type MissionId = "destroyCars" | "comboStreak" | "bestiaMode";
export type FlashMissionId =
  | "flashChery"
  | "flashFocusEco"
  | "flashPoliceBestia"
  | "flashRappiCars"
  | "flashCallejero";

export type MissionSnapshot = {
  id: MissionId | FlashMissionId;
  label: string;
  progress: number;
  target: number;
  bonus: number;
  completed: boolean;
  isFlash?: boolean;
  remainingSeconds?: number;
};

export type MissionCompletion = MissionSnapshot & {
  bonus: number;
  bestiaCharge?: number;
};

export type HitResult = {
  kind: VehicleKind;
  carModel?: CarModel;
  points: number;
  comboMultiplier: number;
  bonusPoints: number;
  bonusLabels: string[];
  bestiaActivated: boolean;
  bestiaModeActive: boolean;
  policePunished: boolean;
  bestiaChargeGain?: number;
};

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
    webkitAudioContext?: typeof AudioContext;
  }
}
