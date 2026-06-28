import Phaser from "phaser";
import { GAME_BALANCE } from "../config/balance";
import { STREET_ASSETS } from "../config/assets";
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
    this.updateRoad(delta);
    this.player.update(time, this.scoring.getPlayerSpeedMultiplier());
    this.traffic.update(time, this.scoring.getDifficulty());
    this.riders.update(time);
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
      this.player.applyPoliceTurnLock(this.simulatedTime);
      this.effects.floatingText(this.player.sprite.x, this.player.sprite.y - 80, "POLICIA: SIN GIRO", {
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
    const points = GAME_BALANCE.riders.basePoints * GAME_BALANCE.riders.scoreMultiplier;
    const x = riderSprite.x;
    const y = riderSprite.y;

    this.riders.destroyRider(riderSprite);
    this.scoring.addBonus(points);
    this.effects.floatingText(x, y - 34, `${rider.label} x${GAME_BALANCE.riders.scoreMultiplier}`, {
      color: rider.kind === "osky" ? "#facc15" : "#fb7185",
      fontSize: 34,
      rise: 78,
    });
    this.effects.floatingText(x, y - 76, `+${points}`, {
      color: "#86efac",
      fontSize: 44,
      rise: 90,
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
          missionsCompleted: this.missions?.getCompletedCount() ?? 0,
          missionsTotal: this.missions?.getTotalCount() ?? 0,
        },
      }),
    );

    const missionSummary = `${this.missions?.getCompletedCount() ?? 0}/${this.missions?.getTotalCount() ?? 0}`;
    this.effects.gameOverOverlay(this.scoring.score, this.scoring.maxCombo, this.scoring.autosDestroyed, missionSummary);
  }

  private drawRoad() {
    this.roadTiles = [];

    if (STREET_ASSETS.some((asset) => !this.textures.exists(asset.key))) {
      this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x171717).setDepth(0);
      return;
    }

    let y = 0;
    STREET_ASSETS.forEach((asset) => {
      const tile = this.add.image(this.scale.width / 2, y, asset.key).setOrigin(0.5, 0).setDepth(0);
      const source = this.textures.get(asset.key).getSourceImage() as HTMLImageElement;
      const scale = this.scale.width / source.width;
      tile.setDisplaySize(this.scale.width, source.height * scale);
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
      }
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
      riders: this.riders?.group.getChildren().map((child) => {
        const sprite = child as Phaser.Physics.Arcade.Sprite;
        return {
          kind: sprite.getData("riderKind") as string,
          x: Math.round(sprite.x),
          y: Math.round(sprite.y),
        };
      }) ?? [],
    });
  }

  private cleanupWindowHooks() {
    delete window.render_game_to_text;
    delete window.advanceTime;
  }
}
