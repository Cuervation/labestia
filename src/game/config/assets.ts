export const ASSET_KEYS = {
  playerTruck: "player-center",
  playerCenter: "player-center",
  playerLeft: "player-left",
  playerRight: "player-right",
  chery: "chery",
  eco: "eco",
  focus: "focus",
  meriva: "meriva",
  renault: "renault",
  normalCar: "normal-car",
  taxi: "taxi",
  policeCar: "police-car",
  van: "van",
  explosion: "explosion",
} as const;

export type AssetKey = (typeof ASSET_KEYS)[keyof typeof ASSET_KEYS];

export const ASSET_MANIFEST = [
  {
    key: ASSET_KEYS.playerCenter,
    path: "/assets/player-center.png",
  },
  {
    key: ASSET_KEYS.playerLeft,
    path: "/assets/player-left.png",
  },
  {
    key: ASSET_KEYS.playerRight,
    path: "/assets/player-right.png",
  },
  {
    key: ASSET_KEYS.chery,
    path: "/assets/chery.png",
  },
  {
    key: ASSET_KEYS.eco,
    path: "/assets/eco.png",
  },
  {
    key: ASSET_KEYS.focus,
    path: "/assets/Focus.png",
  },
  {
    key: ASSET_KEYS.meriva,
    path: "/assets/meriva.png",
  },
  {
    key: ASSET_KEYS.renault,
    path: "/assets/renault.png",
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
    path: "/assets/police-car.png",
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
