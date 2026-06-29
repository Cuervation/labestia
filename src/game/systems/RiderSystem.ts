import Phaser from "phaser";
import { ASSET_KEYS } from "../config/assets";
import { GAME_BALANCE } from "../config/balance";

export type RiderKind = "osky" | "gaston";

const RIDERS: Array<{ kind: RiderKind; texture: string; label: string }> = [
  { kind: "osky", texture: ASSET_KEYS.riderOsky, label: "PEDIDOSYA COMBO +50%" },
  { kind: "gaston", texture: ASSET_KEYS.riderGaston, label: "RAPPI x2" },
];

export class RiderSystem {
  readonly group: Phaser.Physics.Arcade.Group;
  private nextSpawnAt = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.group = scene.physics.add.group();
    this.ensureRiderTextures();
  }

  update(time: number) {
    if (this.nextSpawnAt === 0) {
      this.scheduleNext(time);
      return;
    }

    if (time >= this.nextSpawnAt) {
      this.spawnRider();
      this.scheduleNext(time);
    }

    this.group.children.each((child) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      if (sprite.y > this.scene.scale.height + 80) {
        sprite.destroy();
      }
      return true;
    });
  }

  destroyRider(sprite: Phaser.Physics.Arcade.Sprite) {
    sprite.disableBody(true, true);
    sprite.destroy();
  }

  clearRiders() {
    this.group.clear(true, true);
  }

  getRider(sprite: Phaser.Physics.Arcade.Sprite) {
    return {
      kind: sprite.getData("riderKind") as RiderKind,
      label: String(sprite.getData("riderLabel") ?? "Bonus Pedido"),
    };
  }

  private scheduleNext(time: number) {
    this.nextSpawnAt = time + Phaser.Math.Between(GAME_BALANCE.riders.spawnMinMs, GAME_BALANCE.riders.spawnMaxMs);
  }

  private spawnRider() {
    const rider = Phaser.Utils.Array.GetRandom(RIDERS);
    const x = Phaser.Utils.Array.GetRandom([...GAME_BALANCE.traffic.lanes]);
    const sprite = this.group.create(x, -70, rider.texture) as Phaser.Physics.Arcade.Sprite;

    sprite.setData("riderKind", rider.kind);
    sprite.setData("riderLabel", rider.label);
    sprite.setVelocityY(GAME_BALANCE.riders.speed);
    sprite.setDepth(7);
    this.scaleRider(sprite);

    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(
      sprite.width * GAME_BALANCE.riders.colliderWidthRatio,
      sprite.height * GAME_BALANCE.riders.colliderHeightRatio,
    );
    body.setOffset(
      sprite.width * GAME_BALANCE.riders.colliderOffsetXRatio,
      sprite.height * GAME_BALANCE.riders.colliderOffsetYRatio,
    );
  }

  private scaleRider(sprite: Phaser.Physics.Arcade.Sprite) {
    sprite.setScale(GAME_BALANCE.riders.spriteHeight / sprite.height);
  }

  private ensureRiderTextures() {
    RIDERS.forEach((rider) => {
      if (this.scene.textures.exists(rider.texture)) {
        return;
      }

      const graphics = this.scene.add.graphics();
      graphics.fillStyle(rider.kind === "osky" ? 0xfacc15 : 0xef4444, 1);
      graphics.fillRoundedRect(0, 0, 54, 88, 14);
      graphics.generateTexture(rider.texture, 54, 88);
      graphics.destroy();
    });
  }
}
