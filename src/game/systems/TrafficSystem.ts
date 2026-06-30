import Phaser from "phaser";
import { ASSET_KEYS } from "../config/assets";
import { GAME_BALANCE, type DifficultyLevel } from "../config/balance";
import type { CarModel, VehicleKind } from "../types";

type SpawnConfig = {
  spawnEveryMs: number;
  minSpeed: number;
  maxSpeed: number;
  policeChance: number;
  modelWeights: Record<CarModel, number>;
};

const VEHICLE_TEXTURES: Record<VehicleKind, string> = {
  normalCar: ASSET_KEYS.normalCar,
  taxi: ASSET_KEYS.taxi,
  van: ASSET_KEYS.van,
  policeCar: ASSET_KEYS.policeCar,
};

const CAR_MODEL_TEXTURES: Record<CarModel, string> = {
  peugeot: ASSET_KEYS.peugeot,
  chery: ASSET_KEYS.chery,
  meriva: ASSET_KEYS.meriva,
  focus: ASSET_KEYS.focus,
  eco: ASSET_KEYS.eco,
};

const CAR_MODELS = Object.keys(CAR_MODEL_TEXTURES) as CarModel[];

const FALLBACK_COLORS: Record<VehicleKind, number> = {
  normalCar: 0x94a3b8,
  taxi: 0xfacc15,
  van: 0x9ca3af,
  policeCar: 0xe5e7eb,
};

export class TrafficSystem {
  readonly group: Phaser.Physics.Arcade.Group;
  private nextSpawnAt = 0;
  private started = false;
  private spawnSequence = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.group = scene.physics.add.group();
    this.ensureVehicleTextures();
  }

  update(time: number, difficulty: DifficultyLevel) {
    const config = GAME_BALANCE.traffic[difficulty] satisfies SpawnConfig;

    if (!this.started) {
      this.started = true;
      this.nextSpawnAt = time + GAME_BALANCE.traffic.firstSpawnDelayMs;
      return;
    }

    if (time >= this.nextSpawnAt) {
      this.spawnVehicle(config);
      this.nextSpawnAt = time + config.spawnEveryMs;
    }

    this.group.children.each((child) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      if (sprite.y > this.scene.scale.height + 120) {
        sprite.destroy();
      }
      return true;
    });

    this.enforceSafePassageWindows();
  }

  destroyVehicle(sprite: Phaser.Physics.Arcade.Sprite) {
    sprite.disableBody(true, true);
    sprite.destroy();
  }

  clearVehicles() {
    this.group.clear(true, true);
  }

  getVehicleKind(sprite: Phaser.Physics.Arcade.Sprite): VehicleKind {
    return sprite.getData("vehicleKind") as VehicleKind;
  }

  getCarModel(sprite: Phaser.Physics.Arcade.Sprite): CarModel | undefined {
    return sprite.getData("carModel") as CarModel | undefined;
  }

  private spawnVehicle(config: SpawnConfig) {
    const kind = this.pickVehicleKind(config.policeChance);
    const y = -90;
    const laneIndex = this.pickLaneWithGuaranteedGap(y);
    if (laneIndex === null) {
      return;
    }

    const x = GAME_BALANCE.traffic.lanes[laneIndex];
    const carModel = kind === "policeCar" ? undefined : this.pickCarModel(config.modelWeights);
    const texture = kind === "policeCar" ? ASSET_KEYS.policeCar : CAR_MODEL_TEXTURES[carModel ?? "peugeot"];
    const speed = this.getSafeSpeed(x, this.getModelSpeed(config, carModel));
    const sprite = this.group.create(x, y, texture) as Phaser.Physics.Arcade.Sprite;

    sprite.setData("vehicleKind", kind);
    sprite.setData("carModel", carModel);
    sprite.setData("vehicleTexture", texture);
    sprite.setData("spawnSequence", this.spawnSequence);
    this.spawnSequence += 1;
    this.scaleVehicle(sprite, kind);
    sprite.setVelocityY(speed);
    sprite.setDepth(kind === "policeCar" ? 8 : 6);

    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(
      sprite.width * GAME_BALANCE.traffic.colliderWidthRatio,
      sprite.height * GAME_BALANCE.traffic.colliderHeightRatio,
    );
    body.setOffset(
      sprite.width * GAME_BALANCE.traffic.colliderOffsetXRatio,
      sprite.height * GAME_BALANCE.traffic.colliderOffsetYRatio,
    );
  }

  private pickLaneWithGuaranteedGap(y: number): number | null {
    const laneIndexes = Phaser.Utils.Array.Shuffle(GAME_BALANCE.traffic.lanes.map((_lane, index) => index));
    const safeLane = laneIndexes.find((laneIndex) => this.hasMinimumGapInLane(laneIndex, y) && !this.wouldCreateFullBlock(laneIndex, y));

    if (safeLane !== undefined) {
      return safeLane;
    }

    return GAME_BALANCE.traffic.spawnSkipIfNoSafeLane ? null : laneIndexes[0] ?? null;
  }

  private hasMinimumGapInLane(laneIndex: number, y: number) {
    const lane = GAME_BALANCE.traffic.lanes[laneIndex];
    const closestVehicle = this.getClosestVehicleInLane(lane);
    return !closestVehicle || closestVehicle.y - y > GAME_BALANCE.traffic.minVehicleGap;
  }

  private getBlockedLanesNearY(y: number, windowPx: number): Set<number> {
    const blockedLanes = new Set<number>();

    this.group.getChildren().forEach((child) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      if (!sprite.active || Math.abs(sprite.y - y) > windowPx) {
        return;
      }

      const laneIndex = this.getLaneIndexForX(sprite.x);
      if (laneIndex !== null) {
        blockedLanes.add(laneIndex);
      }
    });

    return blockedLanes;
  }

  private wouldCreateFullBlock(laneIndex: number, y: number) {
    const blockedLanes = this.getBlockedLanesNearY(y, GAME_BALANCE.traffic.safePassageWindowPx);
    blockedLanes.add(laneIndex);
    return blockedLanes.size > GAME_BALANCE.traffic.maxBlockedLanesInWindow;
  }

  private enforceSafePassageWindows() {
    const vehicles = this.getActiveLaneVehicles().sort((left, right) => left.sprite.y - right.sprite.y);

    vehicles.forEach(({ sprite }) => {
      if (!sprite.active) {
        return;
      }

      const blockersByLane = new Map<number, Phaser.Physics.Arcade.Sprite>();
      vehicles.forEach((candidate) => {
        if (!candidate.sprite.active || Math.abs(candidate.sprite.y - sprite.y) > GAME_BALANCE.traffic.safePassageWindowPx) {
          return;
        }

        const current = blockersByLane.get(candidate.laneIndex);
        if (!current || this.getSpawnSequence(candidate.sprite) > this.getSpawnSequence(current)) {
          blockersByLane.set(candidate.laneIndex, candidate.sprite);
        }
      });

      if (blockersByLane.size <= GAME_BALANCE.traffic.maxBlockedLanesInWindow) {
        return;
      }

      this.removeNewestBlocker([...blockersByLane.values()]);
    });
  }

  private getActiveLaneVehicles() {
    return this.group
      .getChildren()
      .map((child) => {
        const sprite = child as Phaser.Physics.Arcade.Sprite;
        return {
          sprite,
          laneIndex: this.getLaneIndexForX(sprite.x),
        };
      })
      .filter((vehicle): vehicle is { sprite: Phaser.Physics.Arcade.Sprite; laneIndex: number } => vehicle.sprite.active && vehicle.laneIndex !== null);
  }

  private removeNewestBlocker(vehicles: Phaser.Physics.Arcade.Sprite[]) {
    const newest = vehicles.reduce((selected, vehicle) =>
      this.getSpawnSequence(vehicle) > this.getSpawnSequence(selected) ? vehicle : selected,
    );

    this.destroyVehicle(newest);
  }

  private getSpawnSequence(sprite: Phaser.Physics.Arcade.Sprite) {
    return Number(sprite.getData("spawnSequence") ?? -1);
  }

  private getLaneIndexForX(x: number) {
    const laneIndex = GAME_BALANCE.traffic.lanes.findIndex((lane) => Math.abs(lane - x) <= 2);
    return laneIndex >= 0 ? laneIndex : null;
  }

  private getSafeSpeed(lane: number, speed: number) {
    const closestVehicle = this.getClosestVehicleInLane(lane);
    if (!closestVehicle) {
      return speed;
    }

    return Math.min(speed, Math.max(0, closestVehicle.body?.velocity.y ?? speed));
  }

  private getClosestVehicleInLane(lane: number): Phaser.Physics.Arcade.Sprite | null {
    let closest: Phaser.Physics.Arcade.Sprite | null = null;

    this.group.getChildren().forEach((child) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      if (!sprite.active || Math.abs(sprite.x - lane) > 2 || sprite.y < -120) {
        return;
      }

      if (!closest || sprite.y < closest.y) {
        closest = sprite;
      }
    });

    return closest;
  }

  private pickVehicleKind(policeChance: number): VehicleKind {
    if (Math.random() < policeChance) {
      return "policeCar";
    }

    return "normalCar";
  }

  private pickCarModel(weights: Record<CarModel, number>) {
    const total = CAR_MODELS.reduce((sum, model) => sum + weights[model], 0);
    let roll = Math.random() * total;

    for (const model of CAR_MODELS) {
      roll -= weights[model];
      if (roll <= 0) {
        return model;
      }
    }

    return "peugeot";
  }

  private getModelSpeed(config: SpawnConfig, carModel?: CarModel) {
    const speed = Phaser.Math.Between(config.minSpeed, config.maxSpeed);
    if (carModel !== "focus") {
      return speed;
    }

    return Math.round(speed * GAME_BALANCE.traffic.focusSpeedMultiplier);
  }

  private scaleVehicle(sprite: Phaser.Physics.Arcade.Sprite, kind: VehicleKind) {
    const targetHeight = kind === "van" ? GAME_BALANCE.traffic.vanHeight : GAME_BALANCE.traffic.carHeight;
    const scale = targetHeight / sprite.height;
    sprite.setScale(scale);
  }

  private ensureVehicleTextures() {
    Object.values(CAR_MODEL_TEXTURES).forEach((key) => {
      if (this.scene.textures.exists(key)) {
        return;
      }

      this.generateFallbackTexture(key, "normalCar");
    });

    const fallbackEntries = Object.entries(VEHICLE_TEXTURES) as Array<[VehicleKind, string]>;

    fallbackEntries.forEach(([kind, key]) => {
      if (this.scene.textures.exists(key)) {
        return;
      }

      this.generateFallbackTexture(key, kind);
    });
  }

  private generateFallbackTexture(key: string, kind: VehicleKind) {
    const width = kind === "van" ? 80 : 68;
    const height = kind === "van" ? 138 : 124;
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x020617, 0.32);
    graphics.fillEllipse(width / 2, height / 2 + 6, width * 0.86, height * 0.9);
    graphics.fillStyle(FALLBACK_COLORS[kind], 1);
    graphics.fillRoundedRect(6, 6, width - 12, height - 12, 12);
    graphics.lineStyle(4, 0x111827, 1);
    graphics.strokeRoundedRect(6, 6, width - 12, height - 12, 12);
    graphics.fillStyle(kind === "taxi" ? 0x111827 : 0xdbeafe, kind === "taxi" ? 0.85 : 0.9);
    graphics.fillRoundedRect(width * 0.28, height * 0.16, width * 0.44, height * 0.18, 6);
    graphics.fillStyle(kind === "policeCar" ? 0x2563eb : 0x111827, 0.28);
    graphics.fillRoundedRect(width * 0.24, height * 0.46, width * 0.52, height * 0.18, 6);
    graphics.fillStyle(0xfef3c7, 1);
    graphics.fillRoundedRect(width * 0.32, 10, width * 0.14, 6, 2);
    graphics.fillRoundedRect(width * 0.54, 10, width * 0.14, 6, 2);
    graphics.fillStyle(0xef4444, 1);
    graphics.fillRoundedRect(width * 0.32, height - 16, width * 0.14, 6, 2);
    graphics.fillRoundedRect(width * 0.54, height - 16, width * 0.14, 6, 2);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }
}
