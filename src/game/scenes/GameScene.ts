import Phaser from "phaser";
import { GAME_BALANCE } from "../config/balance";
import { EffectsSystem, HudSystem, PlayerSystem, ScoringSystem, TrafficSystem } from "../systems";
import type { VehicleKind } from "../types";

export class GameScene extends Phaser.Scene {
  private player?: PlayerSystem;
  private scoring?: ScoringSystem;
  private traffic?: TrafficSystem;
  private effects?: EffectsSystem;
  private hud?: HudSystem;
  private gameOverSent = false;
  private smokeAccumulatorMs = 0;

  constructor() {
    super("GameScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#111111");
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

    this.drawRoad();

    this.player = new PlayerSystem(this);
    this.scoring = new ScoringSystem();
    this.traffic = new TrafficSystem(this);
    this.effects = new EffectsSystem(this);
    this.hud = new HudSystem(this);

    this.physics.add.overlap(
      this.player.sprite,
      this.traffic.group,
      (_playerObject, vehicleObject) => {
        this.handleVehicleCollision(vehicleObject as Phaser.Physics.Arcade.Sprite);
      },
    );

    window.render_game_to_text = () => this.renderGameToText();
    window.advanceTime = (ms: number) => this.stepGame(this.time.now, ms);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanupWindowHooks());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanupWindowHooks());
  }

  update(time: number, delta: number) {
    this.stepGame(time, delta);
  }

  private stepGame(time: number, delta: number) {
    if (!this.player || !this.scoring || !this.traffic || !this.effects || !this.hud || this.gameOverSent) {
      return;
    }

    this.scoring.update(delta);
    this.player.update(time, this.scoring.getPlayerSpeedMultiplier());
    this.traffic.update(time, this.scoring.getDifficulty());
    this.hud.update(this.scoring);
    this.emitSmoke(delta);

    if (this.scoring.isFinished()) {
      this.finishGame();
    }
  }

  private handleVehicleCollision(vehicle: Phaser.Physics.Arcade.Sprite) {
    if (!this.player || !this.scoring || !this.traffic || !this.effects || this.gameOverSent || !vehicle.active) {
      return;
    }

    const kind = this.traffic.getVehicleKind(vehicle);
    const hit = this.scoring.registerHit(kind, this.time.now);
    const x = vehicle.x;
    const y = vehicle.y;

    this.traffic.destroyVehicle(vehicle);
    this.effects.sparks(x, y);
    this.effects.explosion(x, y);
    this.effects.floatingText(x, y - 34, `+${hit.points}`, kind === "policeCar" ? "#60a5fa" : "#facc15");

    if (hit.comboMultiplier >= 2) {
      this.effects.floatingText(x, y - 70, `x${hit.comboMultiplier} Combo`, "#ffffff");
    }

    if (hit.bestiaActivated) {
      this.effects.floatingText(this.scale.width / 2, 150, "BESTIA MODE", "#facc15");
    }

    if (kind === "policeCar") {
      this.player.applyPoliceSlow(this.time.now);
      this.effects.floatingText(this.player.sprite.x, this.player.sprite.y - 80, "POLICIA: SLOW", "#93c5fd");
    }
  }

  private emitSmoke(delta: number) {
    if (!this.player || !this.effects) {
      return;
    }

    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    if (body.velocity.lengthSq() < 1000) {
      this.smokeAccumulatorMs = 0;
      return;
    }

    this.smokeAccumulatorMs += delta;
    if (this.smokeAccumulatorMs < 90) {
      return;
    }

    this.smokeAccumulatorMs = 0;
    this.effects.smoke(this.player.sprite.x, this.player.sprite.y + this.player.sprite.displayHeight / 2 - 10);
  }

  private finishGame() {
    if (!this.scoring || this.gameOverSent) {
      return;
    }

    this.gameOverSent = true;
    this.physics.pause();

    window.dispatchEvent(
      new CustomEvent("laBestia:gameOver", {
        detail: {
          score: this.scoring.score,
          maxCombo: this.scoring.maxCombo,
          autosDestroyed: this.scoring.autosDestroyed,
        },
      }),
    );

    this.add
      .text(this.scale.width / 2, this.scale.height / 2, "FIN DE PARTIDA", {
        color: "#facc15",
        fontFamily: "Arial, sans-serif",
        fontSize: "54px",
        fontStyle: "bold",
        stroke: "#111111",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(120);
  }

  private drawRoad() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x1f1f1f, 1);
    graphics.fillRect(120, 0, this.scale.width - 240, this.scale.height);
    graphics.lineStyle(4, 0xfacc15, 0.35);

    for (let x = 260; x < this.scale.width - 160; x += 160) {
      graphics.lineBetween(x, 0, x, this.scale.height);
    }

    graphics.lineStyle(6, 0xffffff, 0.18);
    graphics.lineBetween(120, 0, 120, this.scale.height);
    graphics.lineBetween(this.scale.width - 120, 0, this.scale.width - 120, this.scale.height);
    graphics.setDepth(0);
  }

  private renderGameToText() {
    const player = this.player?.sprite;
    const traffic = this.traffic?.group.getChildren().map((child) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      return {
        kind: sprite.getData("vehicleKind") as VehicleKind,
        x: Math.round(sprite.x),
        y: Math.round(sprite.y),
      };
    });

    return JSON.stringify({
      coordinateSystem: "origin top-left, x right, y down",
      mode: this.gameOverSent ? "finished" : "running",
      player: player
        ? {
            x: Math.round(player.x),
            y: Math.round(player.y),
          }
        : null,
      playerFacing: this.player?.getFacing?.() ?? "center",
      score: this.scoring?.score ?? 0,
      combo: this.scoring?.comboCount ?? 0,
      bestiaMode: this.scoring?.bestiaModeActive ?? false,
      remainingSeconds: Math.ceil(this.scoring?.remainingSeconds ?? GAME_BALANCE.durationSeconds),
      traffic,
    });
  }

  private cleanupWindowHooks() {
    delete window.render_game_to_text;
    delete window.advanceTime;
  }
}
