export type GameSessionState = "countdown" | "running" | "finished";

export type VehicleKind = "normalCar" | "taxi" | "van" | "policeCar";
export type CarModel = "peugeot" | "chery" | "meriva" | "focus" | "eco";

export type SuperJackpotSnapshot = {
  id: string;
  label: string;
  progress: number;
  target: number;
  multiplier: number;
  active: boolean;
  completed: boolean;
  subtotal: number;
};

export type SuperJackpotHitStatus = "inactive" | "progress" | "bonus";

export type SuperJackpotHitResult = {
  status: SuperJackpotHitStatus;
  snapshot: SuperJackpotSnapshot;
  awardedScore: number;
};

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
    webkitAudioContext?: typeof AudioContext;
  }
}
