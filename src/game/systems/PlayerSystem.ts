import Phaser from "phaser";
import { ASSET_KEYS } from "../config/assets";
import { GAME_BALANCE } from "../config/balance";

export class PlayerSystem {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd?: Record<string, Phaser.Input.Keyboard.Key>;
  private readonly pressedKeys = new Set<string>();
  private readonly laneXs = GAME_BALANCE.traffic.lanes;
  private currentLaneIndex = 0;
  private lastInputDirection = 0;
  private steeringLockedUntil = 0;
  private touchDirection = 0;
  private currentTextureKey: string = ASSET_KEYS.playerCenter;
  private laneChange?: {
    direction: number;
    fromX: number;
    toX: number;
    startedAt: number;
    endsAt: number;
  };
  private laneChangeCooldownUntil = 0;
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
    this.currentLaneIndex = this.getNearestLaneIndex(scene.scale.width / 2);

    this.sprite = scene.physics.add.sprite(
      this.laneXs[this.currentLaneIndex] ?? scene.scale.width / 2,
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

  update(time: number, speedMultiplier: number, invertHorizontalInput = false) {
    let direction = this.touchDirection;

    if (this.isPressed("ArrowLeft", this.cursors?.left.isDown, this.wasd?.A.isDown)) {
      direction -= 1;
    }
    if (this.isPressed("ArrowRight", this.cursors?.right.isDown, this.wasd?.D.isDown)) {
      direction += 1;
    }

    direction = Phaser.Math.Clamp(direction, -1, 1);
    if (invertHorizontalInput) {
      direction *= -1;
    }

    if (this.isSteeringLocked(time)) {
      direction = 0;
    }

    this.updateLaneChange(time);

    if (direction === 0) {
      this.lastInputDirection = 0;
    } else if (direction !== this.lastInputDirection) {
      if (this.canStartLaneChange(time)) {
        this.startLaneChange(direction, time);
      }
      this.lastInputDirection = direction;
    }

    this.sprite.setVelocity(0, 0);

    const visualDirection = this.laneChange?.direction ?? direction;
    if (visualDirection < 0) {
      this.setTexture(ASSET_KEYS.playerLeft);
    } else if (visualDirection > 0) {
      this.setTexture(ASSET_KEYS.playerRight);
    } else {
      this.setTexture(ASSET_KEYS.playerCenter);
    }
  }

  applyPoliceTurnLock(time: number) {
    this.steeringLockedUntil = time + GAME_BALANCE.policeTurnLockDurationMs;
  }

  idle() {
    this.sprite.setVelocity(0, 0);
    if (!this.laneChange) {
      this.sprite.setX(this.laneXs[this.currentLaneIndex] ?? this.sprite.x);
    }
    this.setTexture(ASSET_KEYS.playerCenter);
  }

  isSteeringLocked(time: number) {
    return time < this.steeringLockedUntil;
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

  getLaneIndex() {
    return this.currentLaneIndex;
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

  private canStartLaneChange(time: number) {
    return !this.laneChange && time >= this.laneChangeCooldownUntil && !this.isSteeringLocked(time);
  }

  private startLaneChange(direction: number, time: number) {
    const nextIndex = Phaser.Math.Clamp(this.currentLaneIndex + direction, 0, this.laneXs.length - 1);
    if (nextIndex === this.currentLaneIndex) {
      return;
    }

    const toX = this.laneXs[nextIndex];
    if (toX === undefined) {
      return;
    }

    this.laneChange = {
      direction,
      fromX: this.sprite.x,
      toX,
      startedAt: time,
      endsAt: time + GAME_BALANCE.player.laneChangeDurationMs,
    };
    this.currentLaneIndex = nextIndex;
  }

  private updateLaneChange(time: number) {
    if (!this.laneChange) {
      this.sprite.setX(this.laneXs[this.currentLaneIndex] ?? this.sprite.x);
      return;
    }

    if (time >= this.laneChange.endsAt) {
      this.sprite.setX(this.laneChange.toX);
      this.laneChangeCooldownUntil = time + GAME_BALANCE.player.laneChangeCooldownMs;
      this.laneChange = undefined;
      return;
    }

    const progress = Phaser.Math.Clamp(
      (time - this.laneChange.startedAt) / GAME_BALANCE.player.laneChangeDurationMs,
      0,
      1,
    );
    const easedProgress = Phaser.Math.Easing.Sine.Out(progress);
    this.sprite.setX(Phaser.Math.Linear(this.laneChange.fromX, this.laneChange.toX, easedProgress));
  }

  private getNearestLaneIndex(x: number) {
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    this.laneXs.forEach((laneX, index) => {
      const distance = Math.abs(laneX - x);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }
}
