import Phaser from "phaser";
import { ASSET_KEYS } from "../config/assets";
import { ScoringSystem } from "./ScoringSystem";
import type { MissionSnapshot } from "../types";

type HudText = Phaser.GameObjects.Text;

export class HudSystem {
  private readonly topOffset = -66;
  private readonly scoreText: HudText;
  private readonly timerText: HudText;
  private readonly difficultyText: HudText;
  private readonly hintText: HudText;
  private readonly missionPanel: Phaser.GameObjects.Graphics;
  private readonly missionTexts: HudText[];

  constructor(scene: Phaser.Scene) {
    this.addTopFrame(scene);
    this.missionPanel = scene.add.graphics();
    this.missionPanel.setScrollFactor(0);
    this.missionPanel.setDepth(99);

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
    this.difficultyText = scene.add.text(scene.scale.width - 28, 158 + this.topOffset, "PUNTAJE ? NIVEL EASY", this.style("#38bdf8", 24, "Teko, Arial, sans-serif")).setOrigin(1, 0);
    this.hintText = scene.add
      .text(scene.scale.width / 2, 330 + this.topOffset, "COMPLET? LA MISI?N PERFECTA", {
        ...this.style("#fff7ed", 22, "Luckiest Guy, Impact, sans-serif"),
        align: "center",
        wordWrap: { width: scene.scale.width - 48 },
      })
      .setOrigin(0.5, 0);
    this.missionTexts = [
      scene.add.text(40, 194 + this.topOffset, "", this.style("#fff7ed", 19, "Luckiest Guy, Impact, sans-serif")),
      scene.add.text(40, 232 + this.topOffset, "", this.style("#fff7ed", 27, "Teko, Arial, sans-serif")),
      scene.add.text(40, 270 + this.topOffset, "", this.style("#fff7ed", 19, "Luckiest Guy, Impact, sans-serif")),
    ];

    [
      this.scoreText,
      this.timerText,
      this.difficultyText,
      this.hintText,
      ...this.missionTexts,
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

  update(scoring: ScoringSystem, missions: MissionSnapshot[] = []) {
    this.scoreText.setText(`${scoring.score.toLocaleString("es-AR")}`);
    this.timerText.setText(this.formatTime(scoring.remainingSeconds));
    this.difficultyText.setText(`PUNTAJE ? NIVEL ${scoring.getDifficulty().toUpperCase()}`);
    this.timerText.setColor(scoring.remainingSeconds <= 10 ? "#ef4444" : "#fff7ed");
    this.updateMission(missions[0]);
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

  private updateMission(mission?: MissionSnapshot) {
    if (!mission) {
      this.missionPanel.clear();
      this.missionTexts.forEach((text) => text.setText(""));
      return;
    }

    this.missionPanel.clear();
    this.missionPanel.fillStyle(0x050505, 0.78);
    this.missionPanel.fillRoundedRect(16, 176 + this.topOffset, 374, 128, 12);
    this.missionPanel.lineStyle(2, 0xfacc15, 0.35);
    this.missionPanel.strokeRoundedRect(16, 176 + this.topOffset, 374, 128, 12);

    this.missionTexts[0].setText(`OBJETIVO: ${mission.label}`);
    this.missionTexts[0].setColor("#facc15");
    this.missionTexts[1].setText(`PROGRESO: ${mission.progress}/${mission.target}`);
    this.missionTexts[1].setColor("#fff7ed");
    this.missionTexts[2].setText(`BONUS: x${mission.multiplier}`);
    this.missionTexts[2].setColor("#86efac");
  }

  private formatTime(seconds: number) {
    const remaining = Math.max(0, Math.ceil(seconds));
    const minutes = Math.floor(remaining / 60);
    const secs = `${remaining % 60}`.padStart(2, "0");
    return `${minutes}:${secs}`;
  }
}
