import Phaser from "phaser";
import { ScoringSystem } from "./ScoringSystem";
import type { MissionSnapshot } from "../types";

type HudText = Phaser.GameObjects.Text;

export class HudSystem {
  private readonly logoText: HudText;
  private readonly scoreText: HudText;
  private readonly timerText: HudText;
  private readonly comboText: HudText;
  private readonly bestiaText: HudText;
  private readonly difficultyText: HudText;
  private readonly hintText: HudText;
  private readonly bestiaPanel: Phaser.GameObjects.Graphics;
  private readonly missionPanel: Phaser.GameObjects.Graphics;
  private readonly missionTexts: HudText[];

  constructor(scene: Phaser.Scene) {
    this.drawPanels(scene);
    this.bestiaPanel = scene.add.graphics();
    this.bestiaPanel.setScrollFactor(0);
    this.bestiaPanel.setDepth(99);
    this.missionPanel = scene.add.graphics();
    this.missionPanel.setScrollFactor(0);
    this.missionPanel.setDepth(99);

    this.logoText = scene.add.text(scene.scale.width / 2, 12, "LA BESTIA", this.logoStyle()).setOrigin(0.5, 0);
    this.timerText = scene.add.text(72, 42, "01:30", this.style("#fff7ed", 36));
    this.scoreText = scene.add.text(scene.scale.width - 116, 42, "0", this.style("#fff7ed", 36)).setOrigin(1, 0);
    this.comboText = scene.add.text(scene.scale.width - 28, 168, "x1\nCOMBO", this.comboStyle()).setOrigin(1, 0);
    this.bestiaText = scene.add.text(scene.scale.width / 2, 82, "", this.style("#facc15", 28)).setOrigin(0.5, 0);
    this.difficultyText = scene.add.text(scene.scale.width - 28, 96, "NIVEL EASY", this.style("#38bdf8", 18)).setOrigin(1, 0);
    this.hintText = scene.add
      .text(scene.scale.width / 2, 304, "CHOCA TODO EN 90 SEGUNDOS", {
        ...this.style("#fff7ed", 22),
        align: "center",
        wordWrap: { width: scene.scale.width - 48 },
      })
      .setOrigin(0.5, 0);
    this.missionTexts = [0, 1, 2].map((index) =>
      scene.add.text(70, 164 + index * 46, "", this.style("#fff7ed", 20)),
    );

    [
      this.logoText,
      this.scoreText,
      this.timerText,
      this.comboText,
      this.bestiaText,
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
    this.comboText.setText(`x${Math.max(scoring.comboCount, 1)}\nCOMBO`);
    this.difficultyText.setText(`PUNTAJE · NIVEL ${scoring.getDifficulty().toUpperCase()}`);
    this.timerText.setColor(scoring.remainingSeconds <= 10 ? "#ef4444" : "#facc15");
    this.updateMissions(missions);

    if (scoring.bestiaModeActive) {
      this.drawBestiaPanel(this.bestiaPanel);
      this.bestiaText.setText(`BESTIA MODE! ${scoring.getBestiaRemainingSeconds()}s`);
      this.bestiaText.setScale(1 + Math.sin(Date.now() / 90) * 0.08);
      this.comboText.setColor("#facc15");
      return;
    }

    this.bestiaPanel.clear();
    this.bestiaText.setText("");
    this.bestiaText.setScale(1);
    this.comboText.setColor("#fecaca");
  }

  private style(color: string, fontSize: number): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      color,
      fontFamily: "Arial, sans-serif",
      fontSize: `${fontSize}px`,
      fontStyle: "bold",
      stroke: "#111111",
      strokeThickness: 4,
    };
  }

  private logoStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      color: "#fff7ed",
      fontFamily: "Impact, Arial Black, sans-serif",
      fontSize: "52px",
      fontStyle: "italic",
      stroke: "#7f1d1d",
      strokeThickness: 9,
      shadow: { color: "#ef4444", offsetX: 5, offsetY: 5, blur: 0, fill: true },
    };
  }

  private comboStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      align: "center",
      color: "#facc15",
      fontFamily: "Impact, Arial Black, sans-serif",
      fontSize: "54px",
      fontStyle: "italic",
      lineSpacing: -10,
      stroke: "#111111",
      strokeThickness: 8,
    };
  }

  private drawPanels(scene: Phaser.Scene) {
    const graphics = scene.add.graphics();
    graphics.fillStyle(0x050505, 0.94);
    graphics.fillRect(0, 0, scene.scale.width, 128);
    graphics.fillStyle(0x7f1d1d, 0.72);
    graphics.fillTriangle(230, 22, 472, 18, 354, 98);
    graphics.fillStyle(0x050505, 0.78);
    graphics.fillRoundedRect(20, 24, 204, 86, 14);
    graphics.fillRoundedRect(scene.scale.width - 224, 24, 204, 86, 14);
    graphics.fillRoundedRect(scene.scale.width - 76, 24, 52, 58, 10);
    graphics.lineStyle(2, 0xffffff, 0.16);
    graphics.strokeRoundedRect(20, 24, 204, 86, 14);
    graphics.strokeRoundedRect(scene.scale.width - 224, 24, 204, 86, 14);
    graphics.strokeRoundedRect(scene.scale.width - 76, 24, 52, 58, 10);
    graphics.lineStyle(8, 0xfff7ed, 0.9);
    graphics.lineBetween(38, 50, 38, 90);
    graphics.lineStyle(4, 0xfff7ed, 0.9);
    graphics.strokeCircle(38, 50, 18);
    graphics.lineStyle(6, 0xfff7ed, 0.88);
    graphics.lineBetween(scene.scale.width - 58, 40, scene.scale.width - 58, 66);
    graphics.lineBetween(scene.scale.width - 42, 40, scene.scale.width - 42, 66);
    graphics.fillStyle(0x38bdf8, 0.98);
    graphics.fillRect(72, 88, 76, 4);
    graphics.fillRect(scene.scale.width - 192, 88, 88, 4);
    graphics.setScrollFactor(0);
    graphics.setDepth(99);
  }

  private updateMissions(missions: MissionSnapshot[]) {
    if (missions.length === 0) {
      this.missionPanel.clear();
      this.missionTexts.forEach((text) => text.setText(""));
      return;
    }

    this.missionPanel.clear();
    this.missionPanel.fillStyle(0x050505, 0.74);
    this.missionPanel.fillRoundedRect(16, 146, 306, 142, 12);
    this.missionPanel.lineStyle(2, 0xfacc15, 0.3);
    this.missionPanel.strokeRoundedRect(16, 146, 306, 142, 12);

    this.missionTexts.forEach((text, index) => {
      const mission = missions[index];
      if (!mission) {
        text.setText("");
        return;
      }

      const icon = mission.completed ? "★" : index === 1 ? "✦" : "★";
      text.setColor(mission.completed ? "#86efac" : "#fff7ed");
      text.setText(`${icon} ${mission.label} ${mission.progress}/${mission.target}`);
    });
  }

  private formatTime(seconds: number) {
    const remaining = Math.max(0, Math.ceil(seconds));
    const minutes = Math.floor(remaining / 60);
    const secs = `${remaining % 60}`.padStart(2, "0");
    return `${minutes}:${secs}`;
  }

  private drawBestiaPanel(graphics: Phaser.GameObjects.Graphics) {
    const centerX = this.bestiaText.scene.scale.width / 2;
    graphics.clear();
    graphics.fillStyle(0x7f1d1d, 0.82);
    graphics.fillRoundedRect(centerX - 210, 10, 420, 64, 18);
    graphics.lineStyle(4, 0xfacc15, 0.72);
    graphics.strokeRoundedRect(centerX - 210, 10, 420, 64, 18);
  }
}
