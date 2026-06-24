export type GameSessionState = "idle" | "running" | "finished";

export type VehicleKind = "normalCar" | "taxi" | "van" | "policeCar";

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
  }
}
