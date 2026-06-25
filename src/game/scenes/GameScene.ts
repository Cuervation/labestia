import Phaser from "phaser";
import { GAME_BALANCE } from "../config/balance";
import { AudioSystem, EffectsSystem, GameStateSystem, HudSystem, MissionSystem, PlayerSystem, ScoringSystem, TrafficSystem } from "../systems";
import type { VehicleKind } from "../types";

export class GameScene extends Phaser.Scene {
  private player?: PlayerSystem;
  private scoring?: ScoringSystem;
  private traffic?: TrafficSystem;
  private effects?: EffectsSystem;
  private hud?: HudSystem;
  private missions?: MissionSystem;
  private audio?: AudioSystem;
  private gameState?: GameStateSystem;
  private gameOverSent = false;
  private smokeAccumulatorMs = 0;
  private simulatedTime = 0;

  constructor() {
    super("GameScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#111111");
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
    this.simulatedTime = this.time.now;

    this.drawRoad();

    this.player = new PlayerSystem(this);
    this.scoring = new ScoringSystem();
    this.traffic = new TrafficSystem(this);
    this.effects = new EffectsSystem(this);
    this.hud = new HudSystem(this);
    this.missions = new MissionSystem();
    this.audio = new AudioSystem();
    this.gameState = new GameStateSystem(this);

    this.physics.add.overlap(
      this.player.sprite,
      this.traffic.group,
      (_playerObject, vehicleObject) => {
        this.handleVehicleCollision(vehicleObject as Phaser.Physics.Arcade.Sprite);
      },
    );

    window.render_game_to_text = () => this.renderGameToText();
    window.advanceTime = (ms: number) => this.advanceGameTime(ms);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanupWindowHooks());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanupWindowHooks());
  }

  update(time: number, delta: number) {
    this.simulatedTime = time;
    this.stepGame(time, delta);
  }

  private advanceGameTime(ms: number) {
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    const delta = ms / steps;

    for (let index = 0; index < steps; index += 1) {
      this.simulatedTime += delta;
      this.stepGame(this.simulatedTime, delta);
      this.physics.world.step(delta / 1000);
      this.physics.world.postUpdate();
    }
  }

  private stepGame(time: number, delta: number) {
    if (
      !this.player ||
      !this.scoring ||
      !this.traffic ||
      !this.effects ||
      !this.hud ||
      !this.missions ||
      !this.gameState ||
      this.gameOverSent
    ) {
      return;
    }

    this.gameState.update(delta);
    this.hud.update(this.scoring, this.missions.getSnapshots());

    if (!this.gameState.running) {
      this.player.idle();
      return;
    }

    this.scoring.update(delta);
    this.player.update(time, this.scoring.getPlayerSpeedMultiplier());
    this.traffic.update(time, this.scoring.getDifficulty());
    this.hud.update(this.scoring, this.missions.getSnapshots());
    this.effects.updateBestiaAura(this.player.sprite, this.scoring.bestiaModeActive);
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
    const hit = this.scoring.registerHit(kind);
    const x = vehicle.x;
    const y = vehicle.y;
    const isPolice = kind === "policeCar";
    const isHighCombo = hit.comboMultiplier >= GAME_BALANCE.effects.highComboThreshold;

    this.traffic.destroyVehicle(vehicle);
    const completedMissions = this.missions?.registerHit(hit) ?? [];
    completedMissions.forEach((mission) => {
      this.scoring?.addBonus(mission.bonus);
    });
    if (completedMissions.length > 0) {
      const bonusTotal = completedMissions.reduce((total, mission) => total + mission.bonus, 0);
      const label = completedMissions.length === 1 ? completedMissions[0].label : `${completedMissions.length} OBJETIVOS`;
      this.effects?.missionComplete(label, bonusTotal);
      this.effects?.floatingText(this.scale.width / 2, 278, `BONUS +${bonusTotal}`, {
        color: "#86efac",
        fontSize: 38,
        rise: 64,
      });
    }
    this.audio?.playHit(kind, hit.comboMultiplier);
    this.effects.impact(kind, hit.comboMultiplier);
    this.effects.sparks(x, y, kind, hit.comboMultiplier);
    this.effects.explosion(x, y, hit.comboMultiplier);
    this.effects.floatingText(x, y - 34, `+${hit.points}`, {
      color: isPolice ? "#60a5fa" : isHighCombo ? "#facc15" : "#fff7ed",
      fontSize: isHighCombo ? 52 : 42,
    });

    if (hit.comboMultiplier >= 2) {
      this.effects.floatingText(x, y - 78, `x${hit.comboMultiplier} COMBO`, {
        color: isHighCombo ? "#facc15" : "#ffffff",
        fontSize: isHighCombo ? 46 : 36,
        rise: 92,
      });
    }

    if (hit.bestiaActivated) {
      this.audio?.playBestiaMode();
      this.effects.bestiaBurst(this.player.sprite.x, this.player.sprite.y);
    }

    if (kind === "policeCar") {
      this.player.applyPoliceSlow(this.simulatedTime);
      this.effects.floatingText(this.player.sprite.x, this.player.sprite.y - 80, "POLICIA: SLOW", {
        color: "#93c5fd",
        fontSize: 34,
      });
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
    if (!this.scoring || !this.effects || this.gameOverSent) {
      return;
    }

    this.gameOverSent = true;
    this.gameState?.finish();
    this.audio?.playGameOver();
    this.effects.clearBestiaAura();
    this.traffic?.clearVehicles();
    this.physics.pause();

    window.dispatchEvent(
      new CustomEvent("laBestia:gameOver", {
        detail: {
          score: this.scoring.score,
          maxCombo: this.scoring.maxCombo,
          carsDestroyed: this.scoring.autosDestroyed,
          durationSeconds: GAME_BALANCE.durationSeconds,
          missionsCompleted: this.missions?.getCompletedCount() ?? 0,
          missionsTotal: this.missions?.getTotalCount() ?? 0,
        },
      }),
    );

    const missionSummary = `${this.missions?.getCompletedCount() ?? 0}/${this.missions?.getTotalCount() ?? 0}`;
    this.effects.gameOverOverlay(this.scoring.score, this.scoring.maxCombo, this.scoring.autosDestroyed, missionSummary);
  }

  private drawRoad() {
    const graphics = this.add.graphics();
    const width = this.scale.width;
    const height = this.scale.height;
    const roadLeft = 120;
    const roadRight = width - 120;

    graphics.fillStyle(0x171717, 1);
    graphics.fillRect(roadLeft, 0, roadRight - roadLeft, height);

    graphics.fillStyle(0x2f2f2f, 1);
    graphics.fillRect(0, 0, roadLeft, height);
    graphics.fillRect(roadRight, 0, roadLeft, height);

    graphics.fillStyle(0x262626, 1);
    for (let y = 0; y < height; y += 56) {
      graphics.fillRect(0, y, roadLeft, 2);
      graphics.fillRect(roadRight, y + 28, roadLeft, 2);
    }

    graphics.lineStyle(8, 0x9f1239, 0.42);
    graphics.lineBetween(roadLeft, 0, roadLeft, height);
    graphics.lineBetween(roadRight, 0, roadRight, height);

    graphics.lineStyle(3, 0xfacc15, 0.32);

    for (let x = 260; x < width - 160; x += 160) {
      for (let y = 18; y < height; y += 86) {
        graphics.lineBetween(x, y, x, y + 48);
      }
    }

    graphics.lineStyle(4, 0xffffff, 0.2);
    graphics.lineBetween(roadLeft + 18, 0, roadLeft + 18, height);
    graphics.lineBetween(roadRight - 18, 0, roadRight - 18, height);

    graphics.fillStyle(0xffffff, 0.52);
    for (let x = roadLeft + 40; x < roadRight - 40; x += 58) {
      graphics.fillRect(x, height - 74, 32, 74);
    }

    this.drawStreetDetails(graphics, roadLeft, roadRight, height);
    graphics.setDepth(0);
  }

  private drawStreetDetails(graphics: Phaser.GameObjects.Graphics, roadLeft: number, roadRight: number, height: number) {
    const details = [
      { x: roadLeft + 72, y: 130, radius: 18 },
      { x: roadRight - 210, y: 310, radius: 24 },
      { x: roadLeft + 390, y: 520, radius: 15 },
    ];

    graphics.fillStyle(0x050505, 0.32);
    details.forEach((detail) => {
      graphics.fillEllipse(detail.x, detail.y, detail.radius * 2, detail.radius);
    });

    graphics.fillStyle(0xfacc15, 0.85);
    graphics.fillRect(28, 96, 52, 10);
    graphics.fillRect(roadRight + 42, 220, 58, 10);
    graphics.fillStyle(0xef4444, 0.58);
    graphics.fillRect(24, 110, 68, 12);
    graphics.fillRect(roadRight + 32, 234, 74, 12);

    graphics.lineStyle(2, 0xffffff, 0.18);
    for (let y = 34; y < height; y += 120) {
      graphics.strokeRect(24, y, 54, 34);
      graphics.strokeRect(roadRight + 42, y + 44, 54, 34);
    }

    this.drawCone(graphics, roadLeft + 42, 250);
    this.drawCone(graphics, roadRight - 44, 470);
    this.drawTrashBin(graphics, 36, 360);
    this.drawTrashBin(graphics, roadRight + 58, 580);
    this.drawBarrioSign(graphics, roadRight + 24, 88, "SAN\nBLAS");
    this.drawBarrioSign(graphics, 18, 612, "PARE");
  }

  private drawCone(graphics: Phaser.GameObjects.Graphics, x: number, y: number) {
    graphics.fillStyle(0xf97316, 0.92);
    graphics.fillTriangle(x, y - 18, x - 15, y + 18, x + 15, y + 18);
    graphics.fillStyle(0xffffff, 0.82);
    graphics.fillRect(x - 10, y + 2, 20, 5);
    graphics.fillStyle(0x111111, 0.55);
    graphics.fillRect(x - 18, y + 18, 36, 6);
  }

  private drawTrashBin(graphics: Phaser.GameObjects.Graphics, x: number, y: number) {
    graphics.fillStyle(0x14532d, 0.9);
    graphics.fillRoundedRect(x, y, 34, 44, 5);
    graphics.fillStyle(0x052e16, 0.9);
    graphics.fillRoundedRect(x - 3, y - 8, 40, 10, 4);
    graphics.lineStyle(2, 0xbbf7d0, 0.25);
    graphics.lineBetween(x + 8, y + 8, x + 8, y + 36);
    graphics.lineBetween(x + 20, y + 8, x + 20, y + 36);
  }

  private drawBarrioSign(graphics: Phaser.GameObjects.Graphics, x: number, y: number, label: string) {
    graphics.fillStyle(label === "PARE" ? 0x7f1d1d : 0x0f3b57, 0.92);
    graphics.fillRoundedRect(x, y, 72, 44, 5);
    graphics.lineStyle(2, 0xffffff, 0.45);
    graphics.strokeRoundedRect(x, y, 72, 44, 5);
    graphics.fillStyle(0xffffff, 0.86);
    const lines = label.split("\n");
    lines.forEach((line, index) => {
      const text = this.add
        .text(x + 36, y + 8 + index * 15, line, {
          color: "#fff7ed",
          fontFamily: "Arial, sans-serif",
          fontSize: "12px",
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0)
        .setDepth(1);
      text.setAlpha(0.86);
    });
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
      mode: this.gameState?.currentState ?? (this.gameOverSent ? "finished" : "running"),
      player: player
        ? {
            x: Math.round(player.x),
            y: Math.round(player.y),
            velocityX: Math.round((player.body as Phaser.Physics.Arcade.Body).velocity.x),
            bodyWidth: Math.round((player.body as Phaser.Physics.Arcade.Body).width),
            bodyHeight: Math.round((player.body as Phaser.Physics.Arcade.Body).height),
          }
        : null,
      playerFacing: this.player?.getFacing?.() ?? "center",
      score: this.scoring?.score ?? 0,
      combo: this.scoring?.comboCount ?? 0,
      bestiaMode: this.scoring?.bestiaModeActive ?? false,
      remainingSeconds: Math.ceil(this.scoring?.remainingSeconds ?? GAME_BALANCE.durationSeconds),
      missions: this.missions?.getSnapshots() ?? [],
      traffic,
    });
  }

  private cleanupWindowHooks() {
    delete window.render_game_to_text;
    delete window.advanceTime;
  }
}
