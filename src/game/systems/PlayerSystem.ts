import Phaser from "phaser";
import { ASSET_KEYS } from "../config/assets";
import { GAME_BALANCE } from "../config/balance";

export class PlayerSystem {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd?: Record<string, Phaser.Input.Keyboard.Key>;
  private readonly pressedKeys = new Set<string>();
  private slowUntil = 0;
  private touchDirection = 0;
  private currentTextureKey: string = ASSET_KEYS.playerCenter;
  private readonly handleKeyDown = (event: KeyboardEvent) => {
    this.pressedKeys.add(event.code);
  };
  private readonly handleKeyUp = (event: KeyboardEvent) => {
    this.pressedKeys.delete(event.code);
  };
  private readonly handleTouchControl = (event: Event) => {
    const customEvent = event as CustomEvent<{ direction?: number }>;
    const direction = Number(customEvent.detail?.direction ?? 0);
    this.touchDirection = Phaser.Math.Clamp(direction, -1, 1);
  };

  constructor(private readonly scene: Phaser.Scene) {
    this.ensurePlayerTextures();

    this.sprite = scene.physics.add.sprite(
      scene.scale.width / 2,
      scene.scale.height - 130,
      ASSET_KEYS.playerCenter,
    );
    this.sprite.setScale(GAME_BALANCE.player.spriteScale);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDepth(10);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(GAME_BALANCE.player.width, GAME_BALANCE.player.height);
    body.setOffset(
      (this.sprite.width - GAME_BALANCE.player.width) / 2,
      (this.sprite.height - GAME_BALANCE.player.height) / 2,
    );

    this.cursors = scene.input.keyboard?.createCursorKeys();
    this.wasd = scene.input.keyboard?.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key> | undefined;

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("laBestia:playerControl", this.handleTouchControl);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanupInputListeners());
    this.scene.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanupInputListeners());
  }

  update(time: number, speedMultiplier: number) {
    let direction = this.touchDirection;

    if (this.isPressed("ArrowLeft", this.cursors?.left.isDown, this.wasd?.A.isDown)) {
      direction -= 1;
    }
    if (this.isPressed("ArrowRight", this.cursors?.right.isDown, this.wasd?.D.isDown)) {
      direction += 1;
    }

    direction = Phaser.Math.Clamp(direction, -1, 1);

    const policeSlow = time < this.slowUntil ? GAME_BALANCE.policeSlowMultiplier : 1;
    const speed = GAME_BALANCE.player.baseSpeed * speedMultiplier * policeSlow;
    const velocityX = direction * speed;

    this.sprite.setVelocityX(velocityX);
    this.sprite.setVelocityY(0);

    if (direction < 0) {
      this.setTexture(ASSET_KEYS.playerLeft);
    } else if (direction > 0) {
      this.setTexture(ASSET_KEYS.playerRight);
    } else {
      this.setTexture(ASSET_KEYS.playerCenter);
    }
  }

  applyPoliceSlow(time: number) {
    this.slowUntil = time + GAME_BALANCE.policeSlowDurationMs;
  }

  idle() {
    this.sprite.setVelocity(0, 0);
    this.setTexture(ASSET_KEYS.playerCenter);
  }

  isSlowed(time: number) {
    return time < this.slowUntil;
  }

  getFacing() {
    if (this.currentTextureKey === ASSET_KEYS.playerLeft) {
      return "left";
    }

    if (this.currentTextureKey === ASSET_KEYS.playerRight) {
      return "right";
    }

    return "center";
  }

  private ensurePlayerTextures() {
    const missingKeys = [ASSET_KEYS.playerCenter, ASSET_KEYS.playerLeft, ASSET_KEYS.playerRight].filter(
      (key) => !this.scene.textures.exists(key),
    );

    if (missingKeys.length === 0) {
      return;
    }

    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xc81e1e, 1);
    graphics.fillRoundedRect(0, 0, 80, 140, 14);
    graphics.lineStyle(4, 0x2a0a0a, 1);
    graphics.strokeRoundedRect(0, 0, 80, 140, 14);

    for (const key of missingKeys) {
      graphics.generateTexture(key, 80, 140);
    }

    graphics.destroy();
  }

  private setTexture(textureKey: string) {
    if (this.currentTextureKey === textureKey) {
      return;
    }

    this.currentTextureKey = textureKey;
    this.sprite.setTexture(textureKey);
  }

  private isPressed(code: string, ...fallbacks: Array<boolean | undefined>) {
    if (this.pressedKeys.has(code)) {
      return true;
    }

    return fallbacks.some(Boolean);
  }

  private cleanupInputListeners() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("laBestia:playerControl", this.handleTouchControl);
  }
}
