import Phaser from "phaser";
import { ASSET_KEYS } from "../config/assets";
import { ScoringSystem } from "./ScoringSystem";
import type { SuperJackpotSnapshot } from "../types";

type HudText = Phaser.GameObjects.Text;

export class HudSystem {
  private readonly topOffset = -66;
  private readonly scoreText: HudText;
  private readonly timerText: HudText;
  private readonly hintText: HudText;
  private readonly sirenImage?: Phaser.GameObjects.Image;
  private readonly rappiImage?: Phaser.GameObjects.Image;
  private readonly minaImage?: Phaser.GameObjects.Image;
  private readonly superJackpotPanel: Phaser.GameObjects.Graphics;
  private readonly superJackpotLetters: HudText[] = [];
  private readonly superJackpotProgressText: HudText;

  constructor(scene: Phaser.Scene) {
    this.addTopFrame(scene);
    this.superJackpotPanel = scene.add.graphics();
    this.superJackpotPanel.setScrollFactor(0);
    this.superJackpotPanel.setDepth(99);

    const timerValueX = 126;
    const scoreValueX = scene.scale.width - 128;

    this.timerText = scene.add
      .text(timerValueX, 104 + this.topOffset, "01:30", this.valueStyle())
      .setOrigin(0.5, 0.5)
      .setPadding(10, 4, 10, 4);
    this.scoreText = scene.add
      .text(scoreValueX, 104 + this.topOffset, "0", this.valueStyle())
      .setOrigin(0.5, 0.5)
      .setPadding(10, 4, 10, 4);
    if (scene.textures.exists(ASSET_KEYS.sirena)) {
      this.sirenImage = scene.add
        .image(scene.scale.width - 54, 204 + this.topOffset, ASSET_KEYS.sirena)
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(101)
        .setVisible(false);
      const source = scene.textures.get(ASSET_KEYS.sirena).getSourceImage() as HTMLImageElement;
      const targetWidth = 108;
      this.sirenImage.setDisplaySize(targetWidth, (source.height / source.width) * targetWidth);
    }
    if (scene.textures.exists(ASSET_KEYS.rappi)) {
      this.rappiImage = scene.add
        .image(scene.scale.width - 148.6, 204 + this.topOffset, ASSET_KEYS.rappi)
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(101)
        .setVisible(false);
      const source = scene.textures.get(ASSET_KEYS.rappi).getSourceImage() as HTMLImageElement;
      const targetWidth = 81.2;
      this.rappiImage.setDisplaySize(targetWidth, (source.height / source.width) * targetWidth);
    }
    if (scene.textures.exists(ASSET_KEYS.mina)) {
      this.minaImage = scene.add
        .image(scene.scale.width - 228.4, 204 + this.topOffset, ASSET_KEYS.mina)
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(101)
        .setVisible(false);
      const source = scene.textures.get(ASSET_KEYS.mina).getSourceImage() as HTMLImageElement;
      const targetWidth = 78.4;
      this.minaImage.setDisplaySize(targetWidth, (source.height / source.width) * targetWidth);
    }
    this.hintText = scene.add
      .text(scene.scale.width / 2, 330 + this.topOffset, "AGUANTÁ HASTA EL SUPERJACKPOT", {
        ...this.style("#fff7ed", 22, "Luckiest Guy, Impact, sans-serif"),
        align: "center",
        wordWrap: { width: scene.scale.width - 48 },
      })
      .setOrigin(0.5, 0);
    const label = "SUPERJACKPOT";
    const startX = 40;
    let cursorX = startX;
    for (const char of label) {
      const text = scene.add.text(cursorX, 238 + this.topOffset, char, {
        color: "#7f1d1d",
        fontFamily: "Luckiest Guy, Impact, sans-serif",
        fontSize: "28px",
        fontStyle: "bold",
        stroke: "#111111",
        strokeThickness: 4,
      });
      text.setOrigin(0, 0.5);
      text.setScrollFactor(0);
      text.setDepth(100);
      this.superJackpotLetters.push(text);
      cursorX += char === "J" ? 24 : char === "P" ? 22 : 20;
    }
    this.superJackpotProgressText = scene.add
      .text(40, 276 + this.topOffset, "", this.style("#fff7ed", 18, "Teko, Arial, sans-serif"))
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(100);

    [
      this.scoreText,
      this.timerText,
      this.hintText,
      ...this.superJackpotLetters,
      this.superJackpotProgressText,
    ].forEach((text) => {
      text.setScrollFactor(0);
      text.setDepth(100);
    });

    scene.tweens.add({
      targets: this.hintText,
      alpha: 0,
      delay: 2500,
      duration: 700,
      onComplete: () => this.hintText.destroy(),
    });
  }

  update(scoring: ScoringSystem, jackpots: SuperJackpotSnapshot[] = []) {
    this.scoreText.setText(`${scoring.score.toLocaleString("es-AR")}`);
    this.timerText.setText(this.formatTime(scoring.remainingSeconds));
    this.timerText.setColor(scoring.remainingSeconds <= 10 ? "#ef4444" : "#fff7ed");
    this.updateSuperJackpot(jackpots[0]);
  }

  setPoliceAlert(active: boolean) {
    this.sirenImage?.setVisible(active);
  }

  setRiderBoost(active: boolean) {
    this.rappiImage?.setVisible(active);
  }

  setWhistleCue(active: boolean) {
    this.minaImage?.setVisible(active);
  }

  private valueStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      align: "center",
      color: "#fff7ed",
      fontFamily: "Teko, Arial, sans-serif",
      fontSize: "36px",
      fontStyle: "bold",
      stroke: "#050505",
      strokeThickness: 5,
    };
  }

  private style(color: string, fontSize: number, fontFamily: string): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      color,
      fontFamily,
      fontSize: `${fontSize}px`,
      fontStyle: "bold",
      stroke: "#111111",
      strokeThickness: 4,
    };
  }

  private addTopFrame(scene: Phaser.Scene) {
    if (!scene.textures.exists(ASSET_KEYS.hudTopFrame)) {
      return;
    }

    const source = scene.textures.get(ASSET_KEYS.hudTopFrame).getSourceImage() as HTMLImageElement;
    const scale = scene.scale.width / source.width;
    scene.add
      .image(scene.scale.width / 2, this.topOffset, ASSET_KEYS.hudTopFrame)
      .setOrigin(0.5, 0)
      .setScale(scale)
      .setScrollFactor(0)
      .setDepth(99);
  }

  private updateSuperJackpot(jackpot?: SuperJackpotSnapshot) {
    if (!jackpot) {
      this.superJackpotPanel.clear();
      this.superJackpotLetters.forEach((text) => text.setText(" "));
      this.superJackpotProgressText.setText("");
      return;
    }

    this.superJackpotPanel.clear();
    this.superJackpotPanel.fillStyle(jackpot.active ? 0x2a0505 : 0x050505, 0.82);
    this.superJackpotPanel.fillRoundedRect(16, 176 + this.topOffset, 374, 128, 12);
    this.superJackpotPanel.lineStyle(2, jackpot.active ? 0xf97316 : 0xfacc15, jackpot.active ? 0.7 : 0.35);
    this.superJackpotPanel.strokeRoundedRect(16, 176 + this.topOffset, 374, 128, 12);

    const progressRatio = jackpot.target > 0 ? Phaser.Math.Clamp(jackpot.progress / jackpot.target, 0, 1) : 0;
    this.superJackpotLetters.forEach((letter, index) => {
      const revealedCount = Math.floor(progressRatio * this.superJackpotLetters.length);
      const isLit = index <= revealedCount - 1;
      const isFinal = jackpot.completed;
      letter.setColor(
        isFinal
          ? "#86efac"
          : isLit
            ? jackpot.active
              ? "#facc15"
              : "#fb923c"
            : "#7f1d1d",
      );
      letter.setAlpha(isLit || isFinal ? 1 : 0.38);
    });
    this.superJackpotProgressText.setText(`PROGRESO ${jackpot.progress}/${jackpot.target}`);
    this.superJackpotProgressText.setColor(jackpot.completed ? "#86efac" : "#fff7ed");
  }

  private formatTime(seconds: number) {
    const remaining = Math.max(0, Math.ceil(seconds));
    const minutes = Math.floor(remaining / 60);
    const secs = `${remaining % 60}`.padStart(2, "0");
    return `${minutes}:${secs}`;
  }
}
