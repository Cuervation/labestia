import Phaser from "phaser";
import { GAME_BALANCE } from "../config/balance";
import { ASSET_KEYS, BACKGROUND_STREET_ASSETS, STREET_ASSETS, type GameAsset } from "../config/assets";
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
  private nextWomanEventAt = 0;
  private roadTiles: Phaser.GameObjects.Image[] = [];
  private streetDecorations: Phaser.GameObjects.Image[] = [];
  private streetRotationIndex = 0;
  private backgroundStreetLoadStarted = false;
  private riderSpeedBoostUntil = 0;
  private riderSpeedBoostMultiplier = 1;
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
    this.nextWomanEventAt = this.simulatedTime + 5000;

    this.drawRoad();
    this.logCreateTiming();
    this.loadBackgroundStreetAssets();

    this.player = new PlayerSystem(this);
    this.scoring = new ScoringSystem();
    this.traffic = new TrafficSystem(this);
    this.effects = new EffectsSystem(this);
    this.hud = new HudSystem(this);
    this.missions = new MissionSystem();
    this.audio = new AudioSystem(this);
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
    if (this.gameState.running && !this.scoring.started) {
      this.scoring.start(performance.now());
    }

    this.hud.update(this.scoring, this.missions.getSnapshots());

    if (!this.gameState.running) {
      this.player.idle();
      return;
    }

    this.scoring.update(performance.now());
    if (this.scoring.isFinished()) {
      this.finishGame();
      return;
    }

    this.missions.update(this.scoring.remainingSeconds);
    const riderBoostMultiplier = this.getRiderBoostMultiplier(time);
    this.updateRoad(time, delta, riderBoostMultiplier);
    this.updateWomanStreetEvent(time);
    const whistleActive = this.isWhistleDialogActive(time);
    this.player.update(time, 1, whistleActive);
    this.hud.setPoliceAlert(this.player.isSteeringLocked(time));
    this.hud.setRiderBoost(riderBoostMultiplier > 1);
    this.hud.setWhistleCue(whistleActive);
    this.traffic.update(time, this.scoring.getDifficulty(), {
      playerLaneIndex: this.player.getLaneIndex(),
      superJackpotActive: this.missions.isActive(),
      trafficSpeedMultiplier: riderBoostMultiplier,
    });
    this.hud.update(this.scoring, this.missions.getSnapshots());
    this.updateWhistleDialog(time);
    this.emitSmoke(delta);
  }

  private handleVehicleCollision(vehicle: Phaser.Physics.Arcade.Sprite) {
    if (!this.player || !this.scoring || !this.traffic || !this.effects || this.gameOverSent || !vehicle.active) {
      return;
    }

    const kind = this.traffic.getVehicleKind(vehicle);
    const carModel = this.traffic.getCarModel(vehicle);
    const x = vehicle.x;
    const y = vehicle.y;
    const isPolice = kind === "policeCar";
    const isRider = this.isRiderKind(kind);

    this.traffic.destroyVehicle(vehicle);

    this.audio?.playHit(kind, 1);
    this.effects.impact(kind, 1);
    this.effects.sparks(x, y, kind, 1);
    this.effects.explosion(x, y, 1);

    if (isRider) {
      this.traffic.addSuperJackpotSpawnBonus({
        cars: 3,
        police: 2,
        riderOsky: 1,
        riderGaston: 1,
      });
      this.boostRiderSpeed(this.simulatedTime, 1.7, 4000);
      this.effects.floatingText(x, y - 34, "RIDER +VELOCIDAD", {
        color: "#f97316",
        fontSize: 38,
      });
      return;
    }

    this.scoring.registerVehicleDestroyed();
    const basePoints = carModel ? this.scoring.addVehicleBaseScore(carModel) : 0;
    const jackpotHit = this.missions?.registerHit(this.scoring, kind !== "policeCar");

    if (jackpotHit?.status === "progress") {
      const label = basePoints > 0 ? `${this.formatCarModel(carModel)} +${basePoints}` : "POLICIA";
      this.effects.floatingText(x, y - 34, `${label} ? SUPER ${jackpotHit.snapshot.progress}/${jackpotHit.snapshot.target}`, {
        color: "#86efac",
        fontSize: 42,
      });
    } else if (jackpotHit?.status === "bonus") {
      const bonusMultiplier = GAME_BALANCE.superJackpot.scoreMultiplier + Math.max(0, jackpotHit.snapshot.progress - GAME_BALANCE.superJackpot.targetCars - 1);
      this.effects.floatingText(this.scale.width / 2, 278, `SUPERJACKPOT x${bonusMultiplier} +${jackpotHit.awardedScore}`, {
        color: "#86efac",
        fontSize: 38,
        rise: 64,
      });
    } else {
      const vehicleLabel = isPolice ? "POLICIA" : this.formatCarModel(carModel);
      const label = basePoints > 0 ? `${vehicleLabel} +${basePoints}` : vehicleLabel;
      this.effects.floatingText(x, y - 34, label, {
        color: isPolice ? "#93c5fd" : "#fb7185",
        fontSize: 40,
      });
    }

    if (kind === "policeCar") {
      this.player.applyPoliceTurnLock(this.simulatedTime);
      this.effects.floatingText(this.player.sprite.x, this.player.sprite.y - 80, "SIN GIRO", {
        color: "#93c5fd",
        fontSize: 34,
      });
    }
  }

  private isRiderKind(kind: VehicleKind) {
    return kind === "riderOsky" || kind === "riderGaston";
  }

  private boostRiderSpeed(time: number, multiplier: number, durationMs: number) {
    this.riderSpeedBoostMultiplier = multiplier;
    this.riderSpeedBoostUntil = Math.max(this.riderSpeedBoostUntil, time + durationMs);
  }

  private getRiderBoostMultiplier(time: number) {
    if (time >= this.riderSpeedBoostUntil) {
      this.riderSpeedBoostMultiplier = 1;
      return 1;
    }

    return this.riderSpeedBoostMultiplier;
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
    this.traffic?.clearVehicles();
    this.physics.pause();

    window.dispatchEvent(
      new CustomEvent("laBestia:gameOver", {
        detail: {
          score: this.scoring.score,
          maxCombo: this.scoring.maxCombo,
          carsDestroyed: this.scoring.autosDestroyed,
          durationSeconds: GAME_BALANCE.durationSeconds,
          endTitle: this.missions?.getEndTitle() ?? "La Bestia",
          missionsCompleted: this.missions?.getCompletedCount() ?? 0,
          missionsTotal: this.missions?.getTotalCount() ?? 0,
        },
      }),
    );

    this.effects.gameOverOverlay(
      this.scoring.score,
      this.scoring.autosDestroyed,
      this.missions?.getEndTitle(),
    );

    this.scene.pause();
  }

  private formatCarModel(model?: string) {
    return (model ?? "auto").toUpperCase();
  }

  private drawRoad() {
    this.roadTiles = [];
    const loadedStreets = this.getLoadedStreetAssets();

    if (loadedStreets.length === 0) {
      this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x171717).setDepth(0);
      return;
    }

    let y = 0;
    let index = 0;

    while (y < this.scale.height + this.getStreetDisplayHeight(loadedStreets[index % loadedStreets.length])) {
      const asset = loadedStreets[index % loadedStreets.length];
      const tile = this.createRoadTile(asset, y);
      this.roadTiles.push(tile);
      y += tile.displayHeight;
      index += 1;
    }

    this.streetRotationIndex = index;
  }

  private updateRoad(time: number, delta: number, riderBoostMultiplier = 1) {
    if (this.roadTiles.length === 0) {
      return;
    }

    const speed = (GAME_BALANCE.player.baseSpeed * 2 * riderBoostMultiplier) * (delta / 1000);
    const loadedStreets = this.getLoadedStreetAssets();
    const topY = () => Math.min(...this.roadTiles.map((tile) => tile.y));

    this.roadTiles.forEach((tile) => {
      tile.y += speed;
      if (tile.y >= this.scale.height) {
        const nextAsset = loadedStreets[this.streetRotationIndex % loadedStreets.length];
        this.applyRoadTileTexture(tile, nextAsset);
        tile.y = topY() - tile.displayHeight;
        this.streetRotationIndex += 1;
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

  private getLoadedStreetAssets() {
    const loaded = STREET_ASSETS.filter((asset) => this.textures.exists(asset.key));
    return loaded.length > 0 ? loaded : STREET_ASSETS.slice(0, 1);
  }

  private createRoadTile(asset: GameAsset, y: number) {
    const tile = this.add.image(this.scale.width / 2, y, asset.key).setOrigin(0.5, 0).setDepth(0);
    this.applyRoadTileTexture(tile, asset);
    return tile;
  }

  private applyRoadTileTexture(tile: Phaser.GameObjects.Image, asset: GameAsset) {
    if (tile.texture.key !== asset.key) {
      tile.setTexture(asset.key);
    }

    const source = this.textures.get(asset.key).getSourceImage() as HTMLImageElement;
    const scale = this.scale.width / source.width;
    tile.setDisplaySize(this.scale.width, source.height * scale);
    tile.setData("streetKey", asset.key);
  }

  private getStreetDisplayHeight(asset: GameAsset) {
    const source = this.textures.get(asset.key).getSourceImage() as HTMLImageElement;
    const scale = this.scale.width / source.width;
    return source.height * scale;
  }

  private loadBackgroundStreetAssets() {
    if (this.backgroundStreetLoadStarted) {
      return;
    }

    const pendingAssets = BACKGROUND_STREET_ASSETS.filter((asset) => !this.textures.exists(asset.key));
    if (pendingAssets.length === 0) {
      return;
    }

    this.backgroundStreetLoadStarted = true;
    const startedAtMs = performance.now();
    pendingAssets.forEach((asset) => this.load.image(asset.key, asset.path));
    this.load.once("complete", () => {
      console.info(`[LOAD] Background streets loaded ${pendingAssets.length} assets in ${Math.round(performance.now() - startedAtMs)}ms`);
    });
    this.load.start();
  }

  private logCreateTiming() {
    const preloadStartedAtMs = this.registry.get("laBestia:minimalPreloadStartedAtMs");
    if (typeof preloadStartedAtMs !== "number") {
      return;
    }

    console.info(`[LOAD] GameScene.create after ${Math.round(performance.now() - preloadStartedAtMs)}ms`);
  }

  private updateWomanStreetEvent(time: number) {
    if (time < this.nextWomanEventAt) {
      return;
    }

    this.spawnWomanStreetEvent();
    this.scheduleNextWomanStreetEvent(time);
  }

  private scheduleNextWomanStreetEvent(fromTime: number) {
    this.nextWomanEventAt =
      fromTime +
      Phaser.Math.Between(
        GAME_BALANCE.streetEvents.womanMinIntervalMs,
        GAME_BALANCE.streetEvents.womanMaxIntervalMs,
      );
  }

  private spawnWomanStreetEvent() {
    if (!this.textures.exists(ASSET_KEYS.woman)) {
      return;
    }

    const side = Phaser.Math.Between(0, 1) === 0 ? "left" : "right";
    const x = side === "left" ? GAME_BALANCE.streetEvents.womanLeftX : GAME_BALANCE.streetEvents.womanRightX;
    const maxY = Math.min(this.scale.height - 260, GAME_BALANCE.streetEvents.womanMaxY);
    const y = Phaser.Math.Between(GAME_BALANCE.streetEvents.womanMinY, Math.max(GAME_BALANCE.streetEvents.womanMinY, maxY));
    const woman = this.add
      .image(x, y, ASSET_KEYS.woman)
      .setScale(GAME_BALANCE.streetEvents.womanScale)
      .setDepth(5);
    this.streetDecorations.push(woman);
    this.audio?.playWhistle();
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

  private isWhistleDialogActive(time: number) {
    return Boolean(this.whistleDialog && time < this.whistleDialog.expiresAt);
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
      remainingSeconds: Math.ceil(this.scoring?.remainingSeconds ?? GAME_BALANCE.durationSeconds),
      mission: this.missions?.getSnapshots()[0] ?? null,
      traffic,
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

