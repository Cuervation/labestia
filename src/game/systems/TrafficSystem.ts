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

type TrafficDirectorContext = {
  playerLaneIndex?: number;
  superJackpotActive?: boolean;
  trafficSpeedMultiplier?: number;
};

type LaneObstacle = {
  laneIndex: number;
  y: number;
};

type LaneVehicle = LaneObstacle & {
  sprite: Phaser.Physics.Arcade.Sprite;
  speed: number;
};

type SuperJackpotSpawnTargets = {
  cars: number;
  police: number;
  riderOsky: number;
  riderGaston: number;
};

const VEHICLE_TEXTURES: Record<VehicleKind, string> = {
  normalCar: ASSET_KEYS.normalCar,
  taxi: ASSET_KEYS.taxi,
  van: ASSET_KEYS.van,
  policeCar: ASSET_KEYS.policeCar,
  riderOsky: ASSET_KEYS.riderOsky,
  riderGaston: ASSET_KEYS.riderGaston,
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
  riderOsky: 0xf97316,
  riderGaston: 0x22c55e,
};

export class TrafficSystem {
  readonly group: Phaser.Physics.Arcade.Group;
  private nextSpawnAt = 0;
  private started = false;
  private spawnCount = 0;
  private lastSpawnedLaneIndex: number | null = null;
  private readonly laneSpawnCounts = GAME_BALANCE.traffic.lanes.map(() => 0);
  private readonly laneLastSpawnAt = GAME_BALANCE.traffic.lanes.map(() => 0);
  private superJackpotStarted = false;
  private superJackpotSpawnedCars = 0;
  private superJackpotSpawnedPolice = 0;
  private superJackpotSpawnedRiderOsky = 0;
  private superJackpotSpawnedRiderGaston = 0;
  private superJackpotSpawnTargets: SuperJackpotSpawnTargets = {
    cars: 0,
    police: 0,
    riderOsky: 0,
    riderGaston: 0,
  };
  private nextSuperJackpotSpawnAt = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.group = scene.physics.add.group();
    this.ensureVehicleTextures();
  }

  update(time: number, difficulty: DifficultyLevel, context: TrafficDirectorContext = {}) {
    const config = GAME_BALANCE.traffic[difficulty] satisfies SpawnConfig;

    if (!this.started) {
      this.started = true;
      this.nextSpawnAt = time + GAME_BALANCE.traffic.firstSpawnDelayMs;
      return;
    }

    if (context.superJackpotActive) {
      this.updateSuperJackpotTraffic(time, config, context);
    } else if (time >= this.nextSpawnAt) {
      this.spawnVehicle(config, time, context.playerLaneIndex, undefined, context.trafficSpeedMultiplier ?? 1);
      this.nextSpawnAt = time + config.spawnEveryMs;
    }

    this.applyTrafficSpeedMultiplier(context.trafficSpeedMultiplier ?? 1);

    this.group.children.each((child) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      if (sprite.y > this.scene.scale.height + 120) {
        sprite.destroy();
      }
      return true;
    });
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

  addSuperJackpotSpawnBonus(bonus: { cars: number; police: number; riderOsky: number; riderGaston: number }) {
    this.superJackpotSpawnTargets.cars += bonus.cars;
    this.superJackpotSpawnTargets.police += bonus.police;
    this.superJackpotSpawnTargets.riderOsky += bonus.riderOsky;
    this.superJackpotSpawnTargets.riderGaston += bonus.riderGaston;
  }

  private updateSuperJackpotTraffic(time: number, baseConfig: SpawnConfig, context: TrafficDirectorContext) {
    if (!this.superJackpotStarted) {
      this.superJackpotStarted = true;
      this.superJackpotSpawnedCars = 0;
      this.superJackpotSpawnedPolice = 0;
      this.superJackpotSpawnedRiderOsky = 0;
      this.superJackpotSpawnedRiderGaston = 0;
      this.superJackpotSpawnTargets = this.pickSuperJackpotSpawnTargets();
      this.nextSuperJackpotSpawnAt = time;
    }

    const config = this.getSuperJackpotConfig(baseConfig);
    let attempts = 0;
    while (
      !this.reachedSuperJackpotSpawnTargets() &&
      time >= this.nextSuperJackpotSpawnAt &&
      attempts < 3
    ) {
      const kind = this.pickSuperJackpotVehicleKind();
      const spawned = this.spawnVehicle(config, time, context.playerLaneIndex, kind, context.trafficSpeedMultiplier ?? 1);
      if (spawned) {
        if (kind === "policeCar") {
          this.superJackpotSpawnedPolice += 1;
        } else if (kind === "riderOsky") {
          this.superJackpotSpawnedRiderOsky += 1;
        } else if (kind === "riderGaston") {
          this.superJackpotSpawnedRiderGaston += 1;
        } else {
          this.superJackpotSpawnedCars += 1;
        }
        this.nextSuperJackpotSpawnAt += GAME_BALANCE.superJackpot.spawnEveryMs;
      } else {
        this.nextSuperJackpotSpawnAt += 100;
      }
      attempts += 1;
    }
  }

  private pickSuperJackpotSpawnTargets(): SuperJackpotSpawnTargets {
    const cars = Phaser.Math.Between(GAME_BALANCE.superJackpot.spawnCarRange.min, GAME_BALANCE.superJackpot.spawnCarRange.max);
    const police = Phaser.Math.Between(GAME_BALANCE.superJackpot.spawnPoliceRange.min, GAME_BALANCE.superJackpot.spawnPoliceRange.max);
    const riders = Phaser.Math.Between(GAME_BALANCE.superJackpot.spawnRiderRange.min, GAME_BALANCE.superJackpot.spawnRiderRange.max);
    const baseRidersPerType = Math.floor(riders / 2);
    const oddRiderGoesToOsky = riders % 2 === 1 && Phaser.Math.Between(0, 1) === 0;

    return {
      cars,
      police,
      riderOsky: baseRidersPerType + (oddRiderGoesToOsky ? 1 : 0),
      riderGaston: baseRidersPerType + (riders % 2 === 1 && !oddRiderGoesToOsky ? 1 : 0),
    };
  }

  private reachedSuperJackpotSpawnTargets() {
    return (
      this.superJackpotSpawnedCars >= this.superJackpotSpawnTargets.cars &&
      this.superJackpotSpawnedPolice >= this.superJackpotSpawnTargets.police &&
      this.superJackpotSpawnedRiderOsky >= this.superJackpotSpawnTargets.riderOsky &&
      this.superJackpotSpawnedRiderGaston >= this.superJackpotSpawnTargets.riderGaston
    );
  }

  private getSuperJackpotConfig(baseConfig: SpawnConfig): SpawnConfig {
    return {
      ...baseConfig,
      spawnEveryMs: GAME_BALANCE.superJackpot.spawnEveryMs,
      policeChance: GAME_BALANCE.superJackpot.policeChance,
    };
  }

  private pickSuperJackpotVehicleKind(): VehicleKind {
    const quotas: Array<{ kind: VehicleKind; remaining: number; target: number }> = [
      {
        kind: "normalCar",
        remaining: this.superJackpotSpawnTargets.cars - this.superJackpotSpawnedCars,
        target: this.superJackpotSpawnTargets.cars,
      },
      {
        kind: "policeCar",
        remaining: this.superJackpotSpawnTargets.police - this.superJackpotSpawnedPolice,
        target: this.superJackpotSpawnTargets.police,
      },
      {
        kind: "riderOsky",
        remaining: this.superJackpotSpawnTargets.riderOsky - this.superJackpotSpawnedRiderOsky,
        target: this.superJackpotSpawnTargets.riderOsky,
      },
      {
        kind: "riderGaston",
        remaining: this.superJackpotSpawnTargets.riderGaston - this.superJackpotSpawnedRiderGaston,
        target: this.superJackpotSpawnTargets.riderGaston,
      },
    ];

    return quotas
      .filter((quota) => quota.remaining > 0)
      .sort((left, right) => right.remaining / right.target - left.remaining / left.target)[0]?.kind ?? "normalCar";
  }

  private spawnVehicle(config: SpawnConfig, time: number, playerLaneIndex?: number, forcedKind?: VehicleKind, trafficSpeedMultiplier = 1) {
    const y = -90;

    for (let attempt = 0; attempt < GAME_BALANCE.traffic.spawnRetryCount; attempt += 1) {
      const kind = forcedKind ?? this.pickVehicleKind(config.policeChance);
      const carModel = kind === "normalCar" ? this.pickCarModel(config.modelWeights) : undefined;
      const desiredSpeed = this.getVehicleSpeed(config, kind, carModel, trafficSpeedMultiplier);
      const laneIndex = this.pickSmartLane(y, desiredSpeed, time, playerLaneIndex);

      if (laneIndex === null) {
        continue;
      }

      this.createVehicle(kind, carModel, laneIndex, y, this.getSafeSpeedForLane(laneIndex, desiredSpeed, y), time);
      this.applyTrafficSpeedMultiplier(trafficSpeedMultiplier);
      this.lastSpawnedVehicleKind = kind;
      return true;
    }

    return false;
  }

  private lastSpawnedVehicleKind: VehicleKind | null = null;

  private getLastSpawnedVehicleKind() {
    return this.lastSpawnedVehicleKind;
  }

  private createVehicle(kind: VehicleKind, carModel: CarModel | undefined, laneIndex: number, y: number, speed: number, time: number) {
    const x = GAME_BALANCE.traffic.lanes[laneIndex];
    const texture = kind === "normalCar" ? CAR_MODEL_TEXTURES[carModel ?? "peugeot"] : VEHICLE_TEXTURES[kind];
    const sprite = this.group.create(x, y, texture) as Phaser.Physics.Arcade.Sprite;

    sprite.setData("vehicleKind", kind);
    sprite.setData("carModel", carModel);
    sprite.setData("vehicleTexture", texture);
    sprite.setData("baseSpeed", speed);
    this.scaleVehicle(sprite, kind, carModel);
    sprite.setVelocityY(speed);
    sprite.setDepth(kind === "policeCar" ? 8 : 6);
    this.registerLaneSpawn(laneIndex, time);

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

  private pickSmartLane(y: number, desiredSpeed: number, time: number, playerLaneIndex?: number): number | null {
    const safeLanes = this.getSafeSpawnLanes(y, desiredSpeed);

    if (safeLanes.length === 0) {
      return GAME_BALANCE.traffic.spawnSkipIfNoSafeLane ? null : this.getThreatLaneOrder(time, playerLaneIndex)[0] ?? null;
    }

    return this.pickWeightedLane(safeLanes, time, playerLaneIndex);
  }

  private getSafeSpawnLanes(candidateY: number, desiredSpeed: number) {
    return GAME_BALANCE.traffic.lanes
      .map((_lane, laneIndex) => laneIndex)
      .filter(
        (laneIndex) =>
          this.hasMinimumGapInLane(laneIndex, candidateY) &&
          this.hasSafeCatchupGap(laneIndex, candidateY, desiredSpeed) &&
          !this.wouldCreateUndodgeableRoute(laneIndex, candidateY),
      );
  }

  private pickWeightedLane(laneIndexes: number[], time: number, playerLaneIndex?: number) {
    const orderedLaneIndexes = this.getThreatLaneOrder(time, playerLaneIndex).filter((laneIndex) => laneIndexes.includes(laneIndex));
    const weights = orderedLaneIndexes.map((laneIndex) => Math.max(1, this.getLaneThreatScore(laneIndex, this.normalizeLaneIndex(playerLaneIndex), time)));
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let roll = Math.random() * totalWeight;

    for (let index = 0; index < orderedLaneIndexes.length; index += 1) {
      roll -= weights[index];
      if (roll <= 0) {
        return orderedLaneIndexes[index];
      }
    }

    return orderedLaneIndexes[0] ?? null;
  }

  private getThreatLaneOrder(time: number, playerLaneIndex?: number) {
    const maxSpawnCount = Math.max(0, ...this.laneSpawnCounts);
    const normalizedPlayerLaneIndex = this.normalizeLaneIndex(playerLaneIndex);

    return GAME_BALANCE.traffic.lanes
      .map((_lane, laneIndex) => ({
        laneIndex,
        score: this.getLaneThreatScore(laneIndex, normalizedPlayerLaneIndex, time, maxSpawnCount),
      }))
      .sort((left, right) => right.score - left.score || left.laneIndex - right.laneIndex)
      .map(({ laneIndex }) => laneIndex);
  }

  private getLaneThreatScore(laneIndex: number, playerLaneIndex: number | null, time: number, maxSpawnCount = Math.max(0, ...this.laneSpawnCounts)) {
    const distanceFromPlayer = playerLaneIndex === null ? 1 : Math.abs(laneIndex - playerLaneIndex);
    const playerPressure =
      distanceFromPlayer === 0
        ? GAME_BALANCE.traffic.playerLaneThreatWeight
        : distanceFromPlayer === 1
          ? GAME_BALANCE.traffic.adjacentLaneThreatWeight
          : GAME_BALANCE.traffic.farLaneThreatWeight;
    const varietyDebt = (maxSpawnCount - this.laneSpawnCounts[laneIndex]) * GAME_BALANCE.traffic.laneVarietyDebtWeight;
    const starvationBonus = Math.max(0, time - this.laneLastSpawnAt[laneIndex] - GAME_BALANCE.traffic.laneStarvationMs) * 0.04;
    const repeatPenalty = laneIndex === this.lastSpawnedLaneIndex ? 12 : 0;

    return playerPressure + varietyDebt + starvationBonus - repeatPenalty;
  }

  private normalizeLaneIndex(playerLaneIndex?: number) {
    return typeof playerLaneIndex === "number" ? Phaser.Math.Clamp(playerLaneIndex, 0, GAME_BALANCE.traffic.lanes.length - 1) : null;
  }

  private registerLaneSpawn(laneIndex: number, time: number) {
    this.spawnCount += 1;
    this.lastSpawnedLaneIndex = laneIndex;
    this.laneSpawnCounts[laneIndex] = (this.laneSpawnCounts[laneIndex] ?? 0) + 1;
    this.laneLastSpawnAt[laneIndex] = time;

    if (this.spawnCount > 90) {
      this.spawnCount = 0;
      const minSpawnCount = Math.min(...this.laneSpawnCounts);
      this.laneSpawnCounts.forEach((_count, index) => {
        this.laneSpawnCounts[index] -= minSpawnCount;
      });
    }
  }

  private hasMinimumGapInLane(laneIndex: number, y: number) {
    const lane = GAME_BALANCE.traffic.lanes[laneIndex];
    const closestVehicle = this.getClosestVehicleInLane(lane);
    return !closestVehicle || closestVehicle.y - y >= GAME_BALANCE.traffic.sameLaneMinGapPx;
  }

  private hasSafeCatchupGap(laneIndex: number, y: number, desiredSpeed: number) {
    const closestVehicle = this.getClosestVehicleAheadInLane(laneIndex, y);
    if (!closestVehicle) {
      return true;
    }

    const gap = closestVehicle.y - y;
    if (gap < GAME_BALANCE.traffic.minSpawnYGapPx) {
      return false;
    }

    if (desiredSpeed <= closestVehicle.speed) {
      return true;
    }

    return gap >= GAME_BALANCE.traffic.sameLaneMinGapPx + GAME_BALANCE.traffic.sameLaneCatchupExtraGapPx;
  }

  private wouldCreateUndodgeableRoute(laneIndex: number, y: number) {
    const obstacles = [...this.getActiveLaneObstacles(y), { laneIndex, y }];
    return this.createsFullBlockBand(obstacles) || this.createsTooTightThreeLaneStagger(obstacles);
  }

  private getActiveLaneObstacles(candidateY: number): LaneObstacle[] {
    const minY = candidateY - GAME_BALANCE.traffic.fullBlockBandPx;
    const maxY = candidateY + GAME_BALANCE.traffic.lookaheadWindowPx;
    const obstacles: LaneObstacle[] = [];

    this.group.getChildren().forEach((child) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      if (!sprite.active || sprite.y < minY || sprite.y > maxY) {
        return;
      }

      const laneIndex = this.getLaneIndexForX(sprite.x);
      if (laneIndex !== null) {
        obstacles.push({ laneIndex, y: sprite.y });
      }
    });

    return obstacles;
  }

  private createsFullBlockBand(obstacles: LaneObstacle[]) {
    return obstacles.some((pivot) => {
      const blockedLanes = new Set(
        obstacles
          .filter((obstacle) => Math.abs(obstacle.y - pivot.y) <= GAME_BALANCE.traffic.fullBlockBandPx)
          .map((obstacle) => obstacle.laneIndex),
      );

      return blockedLanes.size > GAME_BALANCE.traffic.maxBlockedLanesPerWindow;
    });
  }

  private createsTooTightThreeLaneStagger(obstacles: LaneObstacle[]) {
    return obstacles.some((pivot) => {
      const nearby = obstacles.filter((obstacle) => Math.abs(obstacle.y - pivot.y) <= GAME_BALANCE.traffic.routeSafetyWindowPx);
      const blockedLanes = new Set(nearby.map((obstacle) => obstacle.laneIndex));

      if (blockedLanes.size < GAME_BALANCE.traffic.lanes.length) {
        return false;
      }

      const closestByLane = new Map<number, LaneObstacle>();
      nearby.forEach((obstacle) => {
        const current = closestByLane.get(obstacle.laneIndex);
        if (!current || Math.abs(obstacle.y - pivot.y) < Math.abs(current.y - pivot.y)) {
          closestByLane.set(obstacle.laneIndex, obstacle);
        }
      });

      const staggeredRows = [...closestByLane.values()].sort((left, right) => left.y - right.y);
      return staggeredRows.some((obstacle, index) => {
        const next = staggeredRows[index + 1];
        return next !== undefined && next.y - obstacle.y < GAME_BALANCE.traffic.minDodgeGapPx;
      });
    });
  }

  private getLaneIndexForX(x: number) {
    const laneIndex = GAME_BALANCE.traffic.lanes.findIndex((lane) => Math.abs(lane - x) <= 2);
    return laneIndex >= 0 ? laneIndex : null;
  }

  private getSafeSpeedForLane(laneIndex: number, desiredSpeed: number, y: number) {
    const closestVehicle = this.getClosestVehicleAheadInLane(laneIndex, y);
    if (!closestVehicle) {
      return desiredSpeed;
    }

    const gap = closestVehicle.y - y;
    if (desiredSpeed <= closestVehicle.speed) {
      return desiredSpeed;
    }

    return Math.max(0, closestVehicle.speed);
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

  private getClosestVehicleAheadInLane(laneIndex: number, y: number): LaneVehicle | null {
    let closest: LaneVehicle | null = null;

    this.getActiveLaneVehicles().forEach((vehicle) => {
      if (vehicle.laneIndex !== laneIndex || vehicle.y <= y) {
        return;
      }

      if (!closest || vehicle.y < closest.y) {
        closest = vehicle;
      }
    });

    return closest;
  }

  private getActiveLaneVehicles() {
    return this.group
      .getChildren()
      .map((child) => {
        const sprite = child as Phaser.Physics.Arcade.Sprite;
        return {
          sprite,
          laneIndex: this.getLaneIndexForX(sprite.x),
          y: sprite.y,
          speed: Math.max(0, (sprite.body as Phaser.Physics.Arcade.Body | null)?.velocity.y ?? 0),
        };
      })
      .filter((vehicle): vehicle is LaneVehicle => vehicle.sprite.active && vehicle.laneIndex !== null);
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

  private getVehicleSpeed(config: SpawnConfig, kind: VehicleKind, carModel?: CarModel, trafficSpeedMultiplier = 1) {
    const speed = Phaser.Math.Between(config.minSpeed, config.maxSpeed);
    const focusBoost = carModel === "focus" ? GAME_BALANCE.traffic.focusSpeedMultiplier : 1;
    const riderSlowdown = kind === "riderOsky" || kind === "riderGaston" ? GAME_BALANCE.traffic.riderSpeedMultiplier : 1;
    return Math.round(speed * GAME_BALANCE.traffic.globalSpeedMultiplier * focusBoost * riderSlowdown * trafficSpeedMultiplier);
  }

  private applyTrafficSpeedMultiplier(multiplier: number) {
    this.group.getChildren().forEach((child) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      if (!sprite.active) {
        return;
      }

      const baseSpeed = sprite.getData("baseSpeed");
      if (typeof baseSpeed !== "number") {
        return;
      }

      sprite.setVelocityY(Math.round(baseSpeed * multiplier));
    });
  }

  private scaleVehicle(sprite: Phaser.Physics.Arcade.Sprite, kind: VehicleKind, carModel?: CarModel) {
    const targetHeight =
      kind === "van"
        ? GAME_BALANCE.traffic.vanHeight
        : kind === "riderOsky"
          ? GAME_BALANCE.traffic.riderOskyHeight
          : kind === "riderGaston"
            ? GAME_BALANCE.traffic.riderGastonHeight
          : GAME_BALANCE.traffic.carHeight;
    const modelScale = carModel ? (GAME_BALANCE.traffic.modelScale[carModel] ?? 1) : 1;
    const scale = (targetHeight * modelScale) / sprite.height;
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
