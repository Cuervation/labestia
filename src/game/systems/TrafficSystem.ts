import Phaser from "phaser";
import { ASSET_KEYS } from "../config/assets";
import { GAME_BALANCE, type DifficultyLevel } from "../config/balance";
import type { VehicleKind } from "../types";

type SpawnConfig = {
  spawnEveryMs: number;
  minSpeed: number;
  maxSpeed: number;
  policeChance: number;
};

const VEHICLE_TEXTURES: Record<VehicleKind, string> = {
  normalCar: ASSET_KEYS.normalCar,
  taxi: ASSET_KEYS.taxi,
  van: ASSET_KEYS.van,
  policeCar: ASSET_KEYS.policeCar,
};

const FALLBACK_COLORS: Record<VehicleKind, number> = {
  normalCar: 0x94a3b8,
  taxi: 0xfacc15,
  van: 0x9ca3af,
  policeCar: 0xe5e7eb,
};

export class TrafficSystem {
  readonly group: Phaser.Physics.Arcade.Group;
  private nextSpawnAt = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.group = scene.physics.add.group();
    this.ensureVehicleTextures();
  }

  update(time: number, difficulty: DifficultyLevel) {
    const config = GAME_BALANCE.traffic[difficulty] satisfies SpawnConfig;

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
  }

  destroyVehicle(sprite: Phaser.Physics.Arcade.Sprite) {
    sprite.disableBody(true, true);
    sprite.destroy();
  }

  getVehicleKind(sprite: Phaser.Physics.Arcade.Sprite): VehicleKind {
    return sprite.getData("vehicleKind") as VehicleKind;
  }

  private spawnVehicle(config: SpawnConfig) {
    const kind = this.pickVehicleKind(config.policeChance);
    const x = Phaser.Utils.Array.GetRandom([...GAME_BALANCE.traffic.lanes]);
    const y = -90;
    const texture = VEHICLE_TEXTURES[kind];
    const sprite = this.scene.physics.add.sprite(x, y, texture);
    const speed = Phaser.Math.Between(config.minSpeed, config.maxSpeed);

    sprite.setData("vehicleKind", kind);
    sprite.setDisplaySize(
      kind === "van" ? GAME_BALANCE.player.width : GAME_BALANCE.traffic.carWidth,
      kind === "van" ? GAME_BALANCE.player.height : GAME_BALANCE.traffic.carHeight,
    );
    sprite.setVelocityY(speed);
    sprite.setDepth(kind === "policeCar" ? 8 : 6);

    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(sprite.displayWidth * 0.74, sprite.displayHeight * 0.78);
    body.setOffset(sprite.displayWidth * 0.13, sprite.displayHeight * 0.12);

    this.group.add(sprite);
  }

  private pickVehicleKind(policeChance: number): VehicleKind {
    if (Math.random() < policeChance) {
      return "policeCar";
    }

    return Phaser.Utils.Array.GetRandom<VehicleKind>(["normalCar", "taxi", "van"]);
  }

  private ensureVehicleTextures() {
    (Object.keys(VEHICLE_TEXTURES) as VehicleKind[]).forEach((kind) => {
      const key = VEHICLE_TEXTURES[kind];
      if (this.scene.textures.exists(key)) {
        return;
      }

      const width = kind === "van" ? 80 : 68;
      const height = kind === "van" ? 138 : 124;
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(FALLBACK_COLORS[kind], 1);
      graphics.fillRoundedRect(0, 0, width, height, 12);
      graphics.lineStyle(4, 0x111827, 1);
      graphics.strokeRoundedRect(0, 0, width, height, 12);
      graphics.generateTexture(key, width, height);
      graphics.destroy();
    });
  }
}
