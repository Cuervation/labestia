export const ASSET_KEYS = {
  playerTruck: "player-center",
  playerCenter: "player-center",
  playerLeft: "player-left",
  playerRight: "player-right",
  chery: "chery",
  eco: "eco",
  focus: "focus",
  meriva: "meriva",
  peugeot: "peugeot",
  renault: "renault",
  normalCar: "normal-car",
  taxi: "taxi",
  policeCar: "police-car",
  van: "van",
  explosion: "explosion",
  riderOsky: "rider-osky",
  riderGaston: "rider-gaston",
  woman: "woman",
  hudTopFrame: "hud-top-frame",
} as const;

export type AssetKey = (typeof ASSET_KEYS)[keyof typeof ASSET_KEYS];

export type GameAsset = {
  key: string;
  path: string;
};

export const STREET_ASSETS = [
  { key: "street-001", path: "/assets/streets/street_001.png" },
  { key: "street-002", path: "/assets/streets/street_002.png" },
  { key: "street-003", path: "/assets/streets/street_003.png" },
  { key: "street-004", path: "/assets/streets/street_004.png" },
  { key: "street-005", path: "/assets/streets/street_005.png" },
  { key: "street-006", path: "/assets/streets/street_006.png" },
  { key: "street-007", path: "/assets/streets/street_007.png" },
  { key: "street-008", path: "/assets/streets/street_008.png" },
  { key: "street-009", path: "/assets/streets/street_009.png" },
  { key: "street-010", path: "/assets/streets/street_010.png" },
  { key: "street-011", path: "/assets/streets/street_011.png" },
] as const satisfies readonly GameAsset[];

export const BOOT_ASSETS = [
  { key: ASSET_KEYS.playerCenter, path: "/assets/player-center.png" },
  { key: ASSET_KEYS.playerLeft, path: "/assets/player-left.png" },
  { key: ASSET_KEYS.playerRight, path: "/assets/player-right.png" },
  { key: ASSET_KEYS.chery, path: "/assets/chery.png" },
  { key: ASSET_KEYS.eco, path: "/assets/eco.png" },
  { key: ASSET_KEYS.focus, path: "/assets/Focus.png" },
  { key: ASSET_KEYS.meriva, path: "/assets/meriva.png" },
  { key: ASSET_KEYS.peugeot, path: "/assets/peugeot.png" },
  { key: ASSET_KEYS.policeCar, path: "/assets/police-car.png" },
  { key: ASSET_KEYS.woman, path: "/assets/mujer.png" },
  { key: ASSET_KEYS.hudTopFrame, path: "/assets/hud/top-hud-frame.png" },
  STREET_ASSETS[0],
  STREET_ASSETS[1],
] as const satisfies readonly GameAsset[];

export const BACKGROUND_STREET_ASSETS = STREET_ASSETS.slice(2);

export const OPTIONAL_ASSETS = [
  { key: ASSET_KEYS.renault, path: "/assets/renault.png" },
  { key: ASSET_KEYS.normalCar, path: "/assets/placeholders/normal-car.svg" },
  { key: ASSET_KEYS.taxi, path: "/assets/placeholders/taxi.svg" },
  { key: ASSET_KEYS.van, path: "/assets/placeholders/van.svg" },
  { key: ASSET_KEYS.explosion, path: "/assets/placeholders/explosion.svg" },
  { key: ASSET_KEYS.riderOsky, path: "/assets/rider_osky.png" },
  { key: ASSET_KEYS.riderGaston, path: "/assets/rider_gaston.png" },
] as const satisfies readonly GameAsset[];

export const ASSET_MANIFEST = [...BOOT_ASSETS, ...BACKGROUND_STREET_ASSETS, ...OPTIONAL_ASSETS] as const;
