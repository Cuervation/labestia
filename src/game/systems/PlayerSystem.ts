import Phaser from "phaser";
import { ASSET_KEYS } from "../config/assets";
import { GAME_BALANCE } from "../config/balance";

export class PlayerSystem {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd?: Record<string, Phaser.Input.Keyboard.Key>;
  private slowUntil = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.ensurePlayerTexture();

    this.sprite = scene.physics.add.sprite(
      scene.scale.width / 2,
      scene.scale.height - 130,
      ASSET_KEYS.playerTruck,
    );
    this.sprite.setDisplaySize(GAME_BALANCE.player.width, GAME_BALANCE.player.height);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDepth(10);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(GAME_BALANCE.player.width * 0.72, GAME_BALANCE.player.height * 0.78);
    body.setOffset(16, 28);

    this.cursors = scene.input.keyboard?.createCursorKeys();
    this.wasd = scene.input.keyboard?.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key> | undefined;
  }

  update(time: number, speedMultiplier: number) {
    const velocity = new Phaser.Math.Vector2(0, 0);

    if (this.cursors?.left.isDown || this.wasd?.A.isDown) {
      velocity.x -= 1;
    }
    if (this.cursors?.right.isDown || this.wasd?.D.isDown) {
      velocity.x += 1;
    }
    if (this.cursors?.up.isDown || this.wasd?.W.isDown) {
      velocity.y -= 1;
    }
    if (this.cursors?.down.isDown || this.wasd?.S.isDown) {
      velocity.y += 1;
    }

    const policeSlow = time < this.slowUntil ? GAME_BALANCE.policeSlowMultiplier : 1;
    const speed = GAME_BALANCE.player.baseSpeed * speedMultiplier * policeSlow;

    if (velocity.lengthSq() > 0) {
      velocity.normalize().scale(speed);
    }

    this.sprite.setVelocity(velocity.x, velocity.y);
    this.sprite.setRotation(Phaser.Math.Clamp(velocity.x / speed, -1, 1) * 0.18 || 0);
  }

  applyPoliceSlow(time: number) {
    this.slowUntil = time + GAME_BALANCE.policeSlowDurationMs;
  }

  isSlowed(time: number) {
    return time < this.slowUntil;
  }

  private ensurePlayerTexture() {
    if (this.scene.textures.exists(ASSET_KEYS.playerTruck)) {
      return;
    }

    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xc81e1e, 1);
    graphics.fillRoundedRect(0, 0, 80, 140, 14);
    graphics.lineStyle(4, 0x2a0a0a, 1);
    graphics.strokeRoundedRect(0, 0, 80, 140, 14);
    graphics.generateTexture(ASSET_KEYS.playerTruck, 80, 140);
    graphics.destroy();
  }
}
