import Phaser from "phaser";
import { GAME_BALANCE } from "../config/balance";
import { ASSET_KEYS, STREET_ASSETS } from "../config/assets";
import { AudioSystem, EffectsSystem, GameStateSystem, HudSystem, MissionSystem, PlayerSystem, RiderSystem, ScoringSystem, TrafficSystem } from "../systems";
import type { VehicleKind } from "../types";

export class GameScene extends Phaser.Scene {
  private player?: PlayerSystem;
  private scoring?: ScoringSystem;
  private traffic?: TrafficSystem;
  private riders?: RiderSystem;
  private effects?: EffectsSystem;
  private hud?: HudSystem;
  private missions?: MissionSystem;
  private audio?: AudioSystem;
  private gameState?: GameStateSystem;
  private gameOverSent = false;
  private smokeAccumulatorMs = 0;
  private simulatedTime = 0;
  private roadTiles: Phaser.GameObjects.Image[] = [];
  private streetDecorations: Phaser.GameObjects.Image[] = [];
  private whistleDialog?: {
    bubble: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
    expiresAt: number;
  };

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
    this.riders = new RiderSystem(this);
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
    this.physics.add.overlap(
      this.player.sprite,
      this.riders.group,
      (_playerObject, riderObject) => {
        this.handleRiderCollision(riderObject as Phaser.Physics.Arcade.Sprite);
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
      !this.riders ||
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
    this.missions.update(this.scoring.elapsedSeconds * 1000);
    this.updateRoad(delta);
    this.player.update(time, this.scoring.getPlayerSpeedMultiplier());
    this.traffic.update(time, this.scoring.getDifficulty());
    this.riders.update(time);
    this.hud.update(this.scoring, this.missions.getSnapshots());
    this.effects.updateBestiaAura(this.player.sprite, this.scoring.bestiaModeActive);
    this.updateWhistleDialog(time);
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
    const carModel = this.traffic.getCarModel(vehicle);
    const hit = this.scoring.registerHit(kind, carModel, vehicle.y, this.scale.height);
    const x = vehicle.x;
    const y = vehicle.y;
    const isPolice = kind === "policeCar";
    const isHighCombo = hit.comboMultiplier >= GAME_BALANCE.effects.highComboThreshold;

    this.traffic.destroyVehicle(vehicle);
    const completedMissions = this.missions?.registerHit(hit, this.scoring) ?? [];
    completedMissions.forEach((mission) => {
      this.scoring?.addBonus(mission.bonus);
      if (mission.bestiaCharge) {
        const bestiaActivated = this.scoring?.addBestiaChargeBonus(mission.bestiaCharge);
        if (bestiaActivated && this.player) {
          this.audio?.playBestiaMode();
          this.effects?.bestiaBurst(this.player.sprite.x, this.player.sprite.y);
        }
      }
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
    const baseLabel = isPolice
      ? hit.bestiaModeActive
        ? "POLICÍA DESTRUIDA +1000"
        : "POLICÍA +250"
      : `${this.formatCarModel(hit.carModel)} +${hit.points}`;

    this.effects.floatingText(x, y - 34, baseLabel, {
      color: isPolice ? "#60a5fa" : isHighCombo ? "#facc15" : "#fff7ed",
      fontSize: isHighCombo ? 52 : 42,
    });

    if (hit.bestiaChargeGain && hit.carModel === "eco") {
      this.effects.floatingText(x, y - 82, `BESTIA +${hit.bestiaChargeGain}%`, {
        color: "#facc15",
        fontSize: 34,
        rise: 82,
      });
    }

    hit.bonusLabels.forEach((label, index) => {
      const normalizedLabel = label.toUpperCase();
      const isSequenceCombo = normalizedLabel.startsWith("COMBO ");
      const labelX = isSequenceCombo ? this.scale.width / 2 : x;
      const labelY = isSequenceCombo ? 250 + index * 50 : y - 84 - index * 42;
      this.effects?.floatingText(labelX, labelY, normalizedLabel, {
        color: normalizedLabel.includes("POLICIA") ? "#93c5fd" : isSequenceCombo ? "#facc15" : "#86efac",
        fontSize: isSequenceCombo ? 46 : 32,
        rise: isSequenceCombo ? 100 : 86,
      });
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

    if (kind === "policeCar" && hit.policePunished) {
      this.player.applyPoliceTurnLock(this.simulatedTime);
      this.effects.floatingText(this.player.sprite.x, this.player.sprite.y - 80, "SIN GIRO", {
        color: "#93c5fd",
        fontSize: 34,
      });
    }
  }

  private handleRiderCollision(riderSprite: Phaser.Physics.Arcade.Sprite) {
    if (!this.scoring || !this.riders || !this.effects || this.gameOverSent || !riderSprite.active) {
      return;
    }

    const rider = this.riders.getRider(riderSprite);
    const x = riderSprite.x;
    const y = riderSprite.y;

    this.riders.destroyRider(riderSprite);
    if (rider.kind === "gaston") {
      this.scoring.activateRappi();
    } else {
      this.scoring.activatePedidosYa();
    }
    this.missions?.registerRider(rider.kind);
    const riderLabel = rider.kind === "gaston" ? "RAPPI x2 8s" : rider.label;
    this.effects.floatingText(x, y - 34, riderLabel, {
      color: rider.kind === "osky" ? "#facc15" : "#fb7185",
      fontSize: 34,
      rise: 78,
    });
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
    this.riders?.clearRiders();
    this.physics.pause();

    window.dispatchEvent(
      new CustomEvent("laBestia:gameOver", {
        detail: {
          score: this.scoring.score,
          maxCombo: this.scoring.maxCombo,
          carsDestroyed: this.scoring.autosDestroyed,
          durationSeconds: GAME_BALANCE.durationSeconds,
          bestiaActivations: this.scoring.bestiaActivations,
          bestComboLabel: this.scoring.bestComboLabel,
          endTitle: this.missions?.getEndTitle(this.scoring) ?? "Destructor Callejero",
          missionsCompleted: this.missions?.getCompletedCount() ?? 0,
          missionsTotal: this.missions?.getTotalCount() ?? 0,
        },
      }),
    );

    const missionSummary = `${this.missions?.getCompletedCount() ?? 0}/${this.missions?.getTotalCount() ?? 0}`;
    this.effects.gameOverOverlay(
      this.scoring.score,
      this.scoring.maxCombo,
      this.scoring.autosDestroyed,
      missionSummary,
      this.scoring.bestComboLabel,
      this.scoring.bestiaActivations,
      this.missions?.getEndTitle(this.scoring),
    );
  }

  private formatCarModel(model?: string) {
    return (model ?? "auto").toUpperCase();
  }

  private drawRoad() {
    this.roadTiles = [];

    if (STREET_ASSETS.some((asset) => !this.textures.exists(asset.key))) {
      this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x171717).setDepth(0);
      return;
    }

    let y = 0;
    STREET_ASSETS.forEach((asset, index) => {
      const tile = this.add.image(this.scale.width / 2, y, asset.key).setOrigin(0.5, 0).setDepth(0);
      const source = this.textures.get(asset.key).getSourceImage() as HTMLImageElement;
      const scale = this.scale.width / source.width;
      tile.setDisplaySize(this.scale.width, source.height * scale);
      tile.setData("streetIndex", index);
      this.roadTiles.push(tile);
      y += tile.displayHeight;
    });
  }

  private updateRoad(delta: number) {
    if (this.roadTiles.length === 0) {
      return;
    }

    const speed = 220 * (delta / 1000);
    const topY = () => Math.min(...this.roadTiles.map((tile) => tile.y));

    this.roadTiles.forEach((tile) => {
      tile.y += speed;
      if (tile.y >= this.scale.height) {
        tile.y = topY() - tile.displayHeight;
        if (tile.getData("streetIndex") === STREET_ASSETS.length - 1) {
          this.spawnWomanStreetEvent();
        }
      }
    });

    this.streetDecorations.forEach((decoration) => {
      decoration.y += speed;
      if (decoration.y > this.scale.height + 120) {
        decoration.destroy();
      }
    });
    this.streetDecorations = this.streetDecorations.filter((decoration) => decoration.active);
  }

  private spawnWomanStreetEvent() {
    if (!this.textures.exists(ASSET_KEYS.woman)) {
      return;
    }

    const side = Phaser.Math.Between(0, 1) === 0 ? "left" : "right";
    const x = side === "left" ? GAME_BALANCE.streetEvents.womanLeftX : GAME_BALANCE.streetEvents.womanRightX;
    const woman = this.add
      .image(x, GAME_BALANCE.streetEvents.womanY, ASSET_KEYS.woman)
      .setScale(GAME_BALANCE.streetEvents.womanScale)
      .setDepth(5);
    this.tweens.add({
      targets: woman,
      y: woman.y + 6,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    this.streetDecorations.push(woman);
    this.showWhistleDialog();
  }

  private showWhistleDialog() {
    const player = this.player?.sprite;
    if (!player) {
      return;
    }

    this.clearWhistleDialog();
    const { x, y } = this.getWhistleAnchor();
    const bubble = this.add.graphics().setDepth(121);
    const text = this.add
      .text(x, y - 4, "FIUUUU!!\nFIUUUU!", {
        align: "center",
        color: "#111111",
        fontFamily: "Impact, Arial Black, sans-serif",
        fontSize: "16px",
        fontStyle: "italic",
        stroke: "#fff7ed",
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setDepth(122);

    this.redrawWhistleDialog(bubble, x, y);
    this.whistleDialog = {
      bubble,
      text,
      expiresAt: this.simulatedTime + GAME_BALANCE.streetEvents.dialogMs,
    };

    this.tweens.add({
      targets: [bubble, text],
      alpha: 0,
      delay: GAME_BALANCE.streetEvents.dialogMs,
      duration: 280,
      onComplete: () => {
        bubble.destroy();
        text.destroy();
        if (this.whistleDialog?.bubble === bubble) {
          this.whistleDialog = undefined;
        }
      },
    });
  }

  private updateWhistleDialog(time: number) {
    if (!this.whistleDialog || !this.player) {
      return;
    }

    if (time >= this.whistleDialog.expiresAt) {
      this.clearWhistleDialog();
      return;
    }

    const { x, y } = this.getWhistleAnchor();
    this.redrawWhistleDialog(this.whistleDialog.bubble, x, y);
    this.whistleDialog.text.setPosition(x, y - 4);
  }

  private getWhistleAnchor() {
    const player = this.player?.sprite;
    const facing = this.player?.getFacing?.() ?? "center";
    const offsetX = facing === "left" ? -42 : facing === "right" ? 42 : 46;
    const x = player ? Phaser.Math.Clamp(player.x + offsetX, 96, this.scale.width - 96) : this.scale.width / 2;
    const y = player ? Math.max(150, player.y - 122) : 240;
    return { x, y };
  }

  private redrawWhistleDialog(bubble: Phaser.GameObjects.Graphics, x: number, y: number) {
    bubble.clear();
    bubble.fillStyle(0xffffff, 0.98);
    bubble.fillRoundedRect(x - 72, y - 24, 144, 44, 12);
    bubble.lineStyle(3, 0x111111, 0.9);
    bubble.strokeRoundedRect(x - 72, y - 24, 144, 44, 12);
    bubble.fillTriangle(x - 16, y + 18, x + 12, y + 18, x - 2, y + 34);
    bubble.lineStyle(3, 0x111111, 0.9);
    bubble.strokeTriangle(x - 16, y + 18, x + 12, y + 18, x - 2, y + 34);
  }

  private clearWhistleDialog() {
    if (!this.whistleDialog) {
      return;
    }

    this.whistleDialog.bubble.destroy();
    this.whistleDialog.text.destroy();
    this.whistleDialog = undefined;
  }

  private renderGameToText() {
    const player = this.player?.sprite;
    const traffic = this.traffic?.group.getChildren().map((child) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      return {
        kind: sprite.getData("vehicleKind") as VehicleKind,
        model: sprite.getData("carModel") as string | undefined,
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
      riders: this.riders?.group.getChildren().map((child) => {
        const sprite = child as Phaser.Physics.Arcade.Sprite;
        return {
          kind: sprite.getData("riderKind") as string,
          x: Math.round(sprite.x),
          y: Math.round(sprite.y),
        };
      }) ?? [],
      streetDecorations: this.streetDecorations.map((decoration) => ({
        texture: decoration.texture.key,
        x: Math.round(decoration.x),
        y: Math.round(decoration.y),
      })),
      whistleDialog: this.whistleDialog
        ? {
            x: Math.round(this.whistleDialog.text.x),
            y: Math.round(this.whistleDialog.text.y),
            text: this.whistleDialog.text.text,
          }
        : null,
    });
  }

  private cleanupWindowHooks() {
    delete window.render_game_to_text;
    delete window.advanceTime;
  }
}
