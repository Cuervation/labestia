export type GameSessionState = "countdown" | "running" | "finished";

export type VehicleKind = "normalCar" | "taxi" | "van" | "policeCar";
export type CarModel = "peugeot" | "chery" | "meriva" | "focus" | "eco";

export type MissionSnapshot = {
  id: string;
  label: string;
  progress: number;
  target: number;
  multiplier: number;
  expectedModel: CarModel;
  subtotal: number;
};

export type MissionHitStatus = "correct" | "nonTarget" | "completed";

export type MissionHitResult = {
  status: MissionHitStatus;
  mission: MissionSnapshot;
  expectedModel: CarModel;
  actualModel?: CarModel;
  basePoints?: number;
  awardedScore: number;
};

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
    webkitAudioContext?: typeof AudioContext;
  }
}
