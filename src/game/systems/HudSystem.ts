import Phaser from "phaser";
import { ASSET_KEYS } from "../config/assets";
import { ScoringSystem } from "./ScoringSystem";
import type { SuperJackpotSnapshot } from "../types";

type HudText = Phaser.GameObjects.Text;

export class HudSystem {
  private readonly topOffset = -66;
  private readonly scoreText: HudText;
  private readonly timerText: HudText;
  private readonly difficultyText: HudText;
  private readonly hintText: HudText;
  private readonly superJackpotPanel: Phaser.GameObjects.Graphics;
  private readonly superJackpotTexts: HudText[];

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
    this.difficultyText = scene.add.text(scene.scale.width - 28, 158 + this.topOffset, "PUNTAJE · NIVEL EASY", this.style("#38bdf8", 24, "Teko, Arial, sans-serif")).setOrigin(1, 0);
    this.hintText = scene.add
      .text(scene.scale.width / 2, 330 + this.topOffset, "AGUANTÁ HASTA EL SUPERJACKPOT", {
        ...this.style("#fff7ed", 22, "Luckiest Guy, Impact, sans-serif"),
        align: "center",
        wordWrap: { width: scene.scale.width - 48 },
      })
      .setOrigin(0.5, 0);
    this.superJackpotTexts = [
      scene.add.text(40, 194 + this.topOffset, "", this.style("#fff7ed", 19, "Luckiest Guy, Impact, sans-serif")),
      scene.add.text(40, 232 + this.topOffset, "", this.style("#fff7ed", 27, "Teko, Arial, sans-serif")),
      scene.add.text(40, 270 + this.topOffset, "", this.style("#fff7ed", 19, "Luckiest Guy, Impact, sans-serif")),
    ];

    [
      this.scoreText,
      this.timerText,
      this.difficultyText,
      this.hintText,
      ...this.superJackpotTexts,
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
    this.difficultyText.setText(`PUNTAJE · NIVEL ${scoring.getDifficulty().toUpperCase()}`);
    this.timerText.setColor(scoring.remainingSeconds <= 10 ? "#ef4444" : "#fff7ed");
    this.updateSuperJackpot(jackpots[0]);
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
      this.superJackpotTexts.forEach((text) => text.setText(""));
      return;
    }

    this.superJackpotPanel.clear();
    this.superJackpotPanel.fillStyle(jackpot.active ? 0x2a0505 : 0x050505, 0.82);
    this.superJackpotPanel.fillRoundedRect(16, 176 + this.topOffset, 374, 128, 12);
    this.superJackpotPanel.lineStyle(2, jackpot.active ? 0xf97316 : 0xfacc15, jackpot.active ? 0.7 : 0.35);
    this.superJackpotPanel.strokeRoundedRect(16, 176 + this.topOffset, 374, 128, 12);

    this.superJackpotTexts[0].setText(jackpot.label);
    this.superJackpotTexts[0].setColor(jackpot.active ? "#fb923c" : "#facc15");
    this.superJackpotTexts[1].setText(`PROGRESO: ${jackpot.progress}/${jackpot.target}`);
    this.superJackpotTexts[1].setColor(jackpot.completed ? "#86efac" : "#fff7ed");
    this.superJackpotTexts[2].setText(`PREMIO: x${jackpot.multiplier} PUNTAJE`);
    this.superJackpotTexts[2].setColor("#86efac");
  }

  private formatTime(seconds: number) {
    const remaining = Math.max(0, Math.ceil(seconds));
    const minutes = Math.floor(remaining / 60);
    const secs = `${remaining % 60}`.padStart(2, "0");
    return `${minutes}:${secs}`;
  }
}
