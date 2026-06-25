import Phaser from "phaser";
import { ASSET_KEYS } from "../config/assets";
import { GAME_BALANCE } from "../config/balance";
import type { VehicleKind } from "../types";

type FloatingTextOptions = {
  color?: string;
  fontSize?: number;
  durationMs?: number;
  rise?: number;
};

export class EffectsSystem {
  private bestiaAura?: Phaser.GameObjects.Graphics;
  private bestiaBurstObjects: Phaser.GameObjects.GameObject[] = [];
  private transientObjects: Phaser.GameObjects.GameObject[] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  impact(kind: VehicleKind, comboMultiplier: number) {
    const isPolice = kind === "policeCar";
    const isHighCombo = comboMultiplier >= GAME_BALANCE.effects.highComboThreshold;
    const duration = isPolice
      ? GAME_BALANCE.effects.policeShakeDurationMs
      : isHighCombo
        ? GAME_BALANCE.effects.highComboShakeDurationMs
        : GAME_BALANCE.effects.normalShakeDurationMs;
    const intensity = isPolice
      ? GAME_BALANCE.effects.policeShakeIntensity
      : isHighCombo
        ? GAME_BALANCE.effects.highComboShakeIntensity
        : GAME_BALANCE.effects.normalShakeIntensity;
    const flashColor = isPolice ? [96, 165, 250] : isHighCombo ? [250, 204, 21] : [255, 210, 90];

    this.scene.cameras.main.shake(duration, intensity);
    this.scene.cameras.main.flash(GAME_BALANCE.effects.impactFlashMs, flashColor[0], flashColor[1], flashColor[2], false);
    this.impactRing(isPolice ? 0x60a5fa : isHighCombo ? 0xfacc15 : 0xf97316);
  }

  sparks(x: number, y: number, kind: VehicleKind, comboMultiplier: number) {
    const isPolice = kind === "policeCar";
    const isHighCombo = comboMultiplier >= GAME_BALANCE.effects.highComboThreshold;
    const count = isPolice ? 28 : isHighCombo ? 34 : 22;
    const color = isPolice ? 0x60a5fa : isHighCombo ? 0xfacc15 : 0xffedd5;

    for (let index = 0; index < count; index += 1) {
      const particle = this.scene.add.circle(x, y, Phaser.Math.Between(3, 7), color, 1);
      particle.setDepth(30);
      this.scene.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-96, 96),
        y: y + Phaser.Math.Between(-78, 78),
        alpha: 0,
        scale: 0.16,
        duration: Phaser.Math.Between(300, 620),
        ease: "Quad.easeOut",
        onComplete: () => particle.destroy(),
      });
    }
  }

  smoke(x: number, y: number) {
    const puff = this.scene.add.circle(x, y, Phaser.Math.Between(6, 12), 0x9ca3af, 0.35);
    puff.setDepth(1);
    this.scene.tweens.add({
      targets: puff,
      y: y + Phaser.Math.Between(10, 30),
      alpha: 0,
      scale: 1.8,
      duration: 600,
      onComplete: () => puff.destroy(),
    });
  }

  explosion(x: number, y: number, comboMultiplier = 1) {
    const size = GAME_BALANCE.traffic.explosionSize + Math.min(comboMultiplier, 5) * 8;
    if (this.scene.textures.exists(ASSET_KEYS.explosion)) {
      const explosion = this.scene.add.image(x, y, ASSET_KEYS.explosion).setDisplaySize(size, size);
      explosion.setDepth(25);
      this.scene.tweens.add({
        targets: explosion,
        alpha: 0,
        scale: 1.75,
        duration: 470,
        onComplete: () => explosion.destroy(),
      });
      return;
    }

    const burst = this.scene.add.circle(x, y, 28, 0xf97316, 0.88).setDepth(25);
    const ring = this.scene.add.circle(x, y, 34, 0xffffff, 0).setStrokeStyle(5, 0xfacc15, 0.9).setDepth(26);
    this.scene.tweens.add({
      targets: burst,
      alpha: 0,
      scale: 3.4,
      duration: 420,
      onComplete: () => burst.destroy(),
    });
    this.scene.tweens.add({
      targets: ring,
      alpha: 0,
      scale: 2.25,
      duration: 450,
      onComplete: () => ring.destroy(),
    });
  }

  floatingText(x: number, y: number, text: string, options: FloatingTextOptions = {}) {
    const label = this.scene.add
      .text(x, y, text, {
        color: options.color ?? "#ffffff",
        fontFamily: "Arial, sans-serif",
        fontSize: `${options.fontSize ?? 40}px`,
        fontStyle: "bold",
        stroke: "#111111",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(55);
    this.transientObjects.push(label);

    this.scene.tweens.add({
      targets: label,
      y: y - (options.rise ?? 76),
      alpha: 0,
      scale: 1.18,
      duration: options.durationMs ?? GAME_BALANCE.effects.floatingTextDurationMs,
      ease: "Quad.easeOut",
      onComplete: () => this.destroyTransientObject(label),
    });
  }

  bestiaBurst(x: number, y: number) {
    this.clearBestiaBurst();
    this.scene.cameras.main.shake(260, 0.016);
    this.scene.cameras.main.flash(170, 250, 204, 21, false);
    const title = this.scene.add
      .text(this.scene.scale.width / 2, 155, "BESTIA MODE", {
        color: "#facc15",
        fontFamily: "Arial, sans-serif",
        fontSize: "72px",
        fontStyle: "bold",
        stroke: "#7f1d1d",
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setDepth(120);
    const ring = this.scene.add.circle(x, y, 76, 0xffffff, 0).setStrokeStyle(8, 0xfacc15, 0.92).setDepth(32);

    this.bestiaBurstObjects = [title, ring];
    this.scene.tweens.add({
      targets: title,
      scale: 1.18,
      y: 120,
      alpha: 0,
      delay: 450,
      duration: 760,
      onComplete: () => this.destroyBestiaBurstObject(title),
    });
    this.scene.tweens.add({
      targets: ring,
      scale: 2.5,
      alpha: 0,
      duration: 760,
      onComplete: () => this.destroyBestiaBurstObject(ring),
    });
  }

  updateBestiaAura(sprite: Phaser.GameObjects.Sprite, active: boolean) {
    if (!active) {
      this.clearBestiaAura();
      return;
    }

    if (!this.bestiaAura) {
      this.bestiaAura = this.scene.add.graphics().setDepth(9);
    }

    const pulse = 0.75 + Math.sin(this.scene.time.now / 90) * 0.15;
    this.bestiaAura.clear();
    this.bestiaAura.lineStyle(5, 0xfacc15, pulse);
    this.bestiaAura.strokeEllipse(sprite.x, sprite.y, sprite.displayWidth + 42, sprite.displayHeight + 42);
    this.bestiaAura.lineStyle(2, 0xef4444, 0.8);
    this.bestiaAura.strokeEllipse(sprite.x, sprite.y, sprite.displayWidth + 66, sprite.displayHeight + 66);
  }

  clearBestiaAura() {
    this.bestiaAura?.destroy();
    this.bestiaAura = undefined;
  }

  clearBestiaBurst() {
    this.bestiaBurstObjects.forEach((item) => item.destroy());
    this.bestiaBurstObjects = [];
  }

  missionComplete(label: string, bonus: number, stackIndex = 0) {
    const centerX = this.scene.scale.width / 2;
    const y = 214 + stackIndex * 72;
    const banner = this.scene.add
      .text(centerX, y, `OBJETIVO COMPLETO\n${label}  +${bonus}`, {
        align: "center",
        color: "#86efac",
        fontFamily: "Arial, sans-serif",
        fontSize: "34px",
        fontStyle: "bold",
        stroke: "#052e16",
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setDepth(121);
    this.transientObjects.push(banner);

    this.scene.tweens.add({
      targets: banner,
      y: y - 42,
      alpha: 0,
      delay: 850,
      duration: 650,
      ease: "Quad.easeOut",
      onComplete: () => this.destroyTransientObject(banner),
    });
  }

  gameOverOverlay(score: number, maxCombo: number, carsDestroyed: number, missionSummary?: string) {
    this.clearBestiaBurst();
    this.clearTransientObjects();
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;
    const panel = this.scene.add.rectangle(centerX, centerY, 720, 330, 0x050505, 0.86).setDepth(118);
    panel.setStrokeStyle(4, 0xfacc15, 0.72);
    const title = this.scene.add
      .text(centerX, centerY - 112, "FIN DE PARTIDA", {
        color: "#facc15",
        fontFamily: "Arial, sans-serif",
        fontSize: "58px",
        fontStyle: "bold",
        stroke: "#7f1d1d",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(120);
    const statsText = `PUNTAJE ${score}\nCOMBO MAX x${maxCombo}\nAUTOS DESTRUIDOS ${carsDestroyed}${
      missionSummary ? `\nOBJETIVOS ${missionSummary}` : ""
    }`;
    const stats = this.scene.add
      .text(centerX, centerY - 24, statsText, {
        align: "center",
        color: "#fff7ed",
        fontFamily: "Arial, sans-serif",
        fontSize: "32px",
        fontStyle: "bold",
        stroke: "#111111",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(120);
    const hint = this.scene.add
      .text(centerX, centerY + 124, "Usá JUGAR DE NUEVO abajo para reiniciar", {
        color: "#fecaca",
        fontFamily: "Arial, sans-serif",
        fontSize: "22px",
        fontStyle: "bold",
        stroke: "#111111",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(120);

    [panel, title, stats, hint].forEach((item) => item.setAlpha(0));
    this.scene.tweens.add({ targets: [panel, title, stats, hint], alpha: 1, duration: 320 });
  }

  private impactRing(color: number) {
    const ring = this.scene.add
      .rectangle(this.scene.scale.width / 2, this.scene.scale.height / 2, this.scene.scale.width - 44, this.scene.scale.height - 44, 0xffffff, 0)
      .setStrokeStyle(8, color, 0.65)
      .setDepth(115);

    this.scene.tweens.add({
      targets: ring,
      alpha: 0,
      duration: 260,
      onComplete: () => ring.destroy(),
    });
  }

  private destroyBestiaBurstObject(item: Phaser.GameObjects.GameObject) {
    item.destroy();
    this.bestiaBurstObjects = this.bestiaBurstObjects.filter((current) => current !== item);
  }

  private destroyTransientObject(item: Phaser.GameObjects.GameObject) {
    item.destroy();
    this.transientObjects = this.transientObjects.filter((current) => current !== item);
  }

  private clearTransientObjects() {
    this.scene.tweens.killTweensOf(this.transientObjects);
    this.transientObjects.forEach((item) => item.destroy());
    this.transientObjects = [];
  }
}
