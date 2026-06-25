import Phaser from "phaser";
import { ScoringSystem } from "./ScoringSystem";
import type { MissionSnapshot } from "../types";

type HudText = Phaser.GameObjects.Text;

export class HudSystem {
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

    this.scoreText = scene.add.text(32, 20, "PUNTAJE 0", this.style("#ffffff", 42));
    this.timerText = scene.add.text(scene.scale.width - 32, 20, "TIEMPO 90s", this.style("#facc15", 42)).setOrigin(1, 0);
    this.comboText = scene.add.text(32, 74, "COMBO x1", this.style("#fecaca", 30));
    this.bestiaText = scene.add.text(scene.scale.width / 2, 18, "", this.style("#facc15", 38)).setOrigin(0.5, 0);
    this.difficultyText = scene.add.text(scene.scale.width - 32, 74, "NIVEL EASY", this.style("#ffffff", 27)).setOrigin(1, 0);
    this.hintText = scene.add
      .text(scene.scale.width / 2, 126, "CHOCA TODO EN 90 SEGUNDOS", this.style("#fff7ed", 34))
      .setOrigin(0.5, 0);
    this.missionTexts = [0, 1, 2].map((index) => scene.add.text(32, 154 + index * 34, "", this.style("#fff7ed", 23)));

    [
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
    this.scoreText.setText(`PUNTAJE ${scoring.score}`);
    this.timerText.setText(`TIEMPO ${Math.ceil(scoring.remainingSeconds)}s`);
    this.comboText.setText(`COMBO x${Math.max(scoring.comboCount, 1)}`);
    this.difficultyText.setText(`NIVEL ${scoring.getDifficulty().toUpperCase()}`);
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

  private drawPanels(scene: Phaser.Scene) {
    const graphics = scene.add.graphics();
    graphics.fillStyle(0x050505, 0.68);
    graphics.fillRoundedRect(14, 12, 365, 118, 14);
    graphics.fillRoundedRect(scene.scale.width - 399, 12, 385, 118, 14);
    graphics.lineStyle(2, 0xffffff, 0.14);
    graphics.strokeRoundedRect(14, 12, 365, 118, 14);
    graphics.strokeRoundedRect(scene.scale.width - 399, 12, 385, 118, 14);
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
    this.missionPanel.fillStyle(0x050505, 0.66);
    this.missionPanel.fillRoundedRect(14, 142, 430, 122, 14);
    this.missionPanel.lineStyle(2, 0xfacc15, 0.24);
    this.missionPanel.strokeRoundedRect(14, 142, 430, 122, 14);

    this.missionTexts.forEach((text, index) => {
      const mission = missions[index];
      if (!mission) {
        text.setText("");
        return;
      }

      const icon = mission.completed ? "OK" : ">";
      text.setColor(mission.completed ? "#86efac" : "#fff7ed");
      text.setText(`${icon} ${mission.label} ${mission.progress}/${mission.target}`);
    });
  }

  private drawBestiaPanel(graphics: Phaser.GameObjects.Graphics) {
    const centerX = this.bestiaText.scene.scale.width / 2;
    graphics.clear();
    graphics.fillStyle(0x7f1d1d, 0.82);
    graphics.fillRoundedRect(centerX - 250, 10, 500, 70, 18);
    graphics.lineStyle(4, 0xfacc15, 0.72);
    graphics.strokeRoundedRect(centerX - 250, 10, 500, 70, 18);
  }
}
