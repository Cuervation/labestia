export const ASSET_KEYS = {
  playerTruck: "player-truck",
  normalCar: "normal-car",
  taxi: "taxi",
  policeCar: "police-car",
  van: "van",
  explosion: "explosion",
} as const;

export type AssetKey = (typeof ASSET_KEYS)[keyof typeof ASSET_KEYS];

export const ASSET_MANIFEST = [
  {
    key: ASSET_KEYS.playerTruck,
    path: "/assets/placeholders/player-truck.svg",
  },
  {
    key: ASSET_KEYS.normalCar,
    path: "/assets/placeholders/normal-car.svg",
  },
  {
    key: ASSET_KEYS.taxi,
    path: "/assets/placeholders/taxi.svg",
  },
  {
    key: ASSET_KEYS.policeCar,
    path: "/assets/placeholders/police-car.svg",
  },
  {
    key: ASSET_KEYS.van,
    path: "/assets/placeholders/van.svg",
  },
  {
    key: ASSET_KEYS.explosion,
    path: "/assets/placeholders/explosion.svg",
  },
] as const;
