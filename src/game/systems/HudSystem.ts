import Phaser from "phaser";
import { ScoringSystem } from "./ScoringSystem";
import type { MissionSnapshot } from "../types";
import { ASSET_KEYS } from "../config/assets";

type HudText = Phaser.GameObjects.Text;

export class HudSystem {
  private readonly topOffset = -66;
  private readonly scoreText: HudText;
  private readonly timerText: HudText;
  private readonly comboText: HudText;
  private readonly bestiaText: HudText;
  private readonly bestiaChargeText: HudText;
  private readonly lastComboText: HudText;
  private readonly riderText: HudText;
  private readonly difficultyText: HudText;
  private readonly hintText: HudText;
  private readonly bestiaPanel: Phaser.GameObjects.Graphics;
  private readonly missionPanel: Phaser.GameObjects.Graphics;
  private readonly missionTexts: HudText[];

  constructor(scene: Phaser.Scene) {
    this.addTopFrame(scene);
    this.bestiaPanel = scene.add.graphics();
    this.bestiaPanel.setScrollFactor(0);
    this.bestiaPanel.setDepth(99);
    this.missionPanel = scene.add.graphics();
    this.missionPanel.setScrollFactor(0);
    this.missionPanel.setDepth(99);

    this.timerText = scene.add
      .text(108, 104 + this.topOffset, "01:30", this.valueStyle())
      .setOrigin(0, 0.5)
      .setPadding(10, 4, 10, 4);
    this.scoreText = scene.add
      .text(scene.scale.width - 122, 104 + this.topOffset, "0", this.valueStyle())
      .setOrigin(1, 0.5)
      .setPadding(10, 4, 10, 4);
    this.comboText = scene.add.text(scene.scale.width - 28, 190 + this.topOffset, "x1\nCOMBO", this.comboStyle()).setOrigin(1, 0);
    this.bestiaText = scene.add.text(scene.scale.width / 2, 182 + this.topOffset, "", this.style("#facc15", 28)).setOrigin(0.5, 0);
    this.bestiaChargeText = scene.add.text(scene.scale.width / 2, 158 + this.topOffset, "BESTIA 0%", this.style("#facc15", 18)).setOrigin(0.5, 0);
    this.lastComboText = scene.add.text(scene.scale.width / 2, 212 + this.topOffset, "", this.style("#86efac", 20)).setOrigin(0.5, 0);
    this.riderText = scene.add.text(scene.scale.width / 2, 240 + this.topOffset, "", this.style("#fb7185", 20)).setOrigin(0.5, 0);
    this.difficultyText = scene.add.text(scene.scale.width - 28, 158 + this.topOffset, "NIVEL EASY", this.style("#38bdf8", 18)).setOrigin(1, 0);
    this.hintText = scene.add
      .text(scene.scale.width / 2, 330 + this.topOffset, "CHOCA TODO EN 90 SEGUNDOS", {
        ...this.style("#fff7ed", 22),
        align: "center",
        wordWrap: { width: scene.scale.width - 48 },
      })
      .setOrigin(0.5, 0);
    this.missionTexts = [0, 1, 2].map((index) =>
      scene.add.text(70, 194 + this.topOffset + index * 46, "", this.style("#fff7ed", 20)),
    );

    [
      this.scoreText,
      this.timerText,
      this.comboText,
      this.bestiaText,
      this.bestiaChargeText,
      this.lastComboText,
      this.riderText,
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
    this.lastComboText.setText(scoring.lastComboLabel);
    this.riderText.setText(scoring.activeRiderLabel);
    this.timerText.setColor(scoring.remainingSeconds <= 10 ? "#ef4444" : "#fff7ed");
    this.updateMissions(missions);

    if (scoring.bestiaModeActive) {
      this.drawBestiaPanel(this.bestiaPanel);
      this.bestiaText.setText(`BESTIA ${scoring.getBestiaRemainingSeconds()}s`);
      this.bestiaChargeText.setText("x2 ROMPE TODO");
      this.bestiaText.setScale(1 + Math.sin(Date.now() / 90) * 0.08);
      this.comboText.setColor("#facc15");
      return;
    }

    this.bestiaPanel.clear();
    this.bestiaText.setText("");
    this.bestiaChargeText.setText(`BESTIA ${Math.round(scoring.getBestiaChargeRatio() * 100)}%`);
    this.bestiaText.setScale(1);
    this.comboText.setColor("#fecaca");
  }
  private valueStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      align: "center",
      color: "#fff7ed",
      fontFamily: "Impact, Haettenschweiler, Arial Black, sans-serif",
      fontSize: "36px",
      fontStyle: "bold",
      stroke: "#050505",
      strokeThickness: 5,
    };
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

  private updateMissions(missions: MissionSnapshot[]) {
    if (missions.length === 0) {
      this.missionPanel.clear();
      this.missionTexts.forEach((text) => text.setText(""));
      return;
    }

    this.missionPanel.clear();
    this.missionPanel.fillStyle(0x050505, 0.74);
    this.missionPanel.fillRoundedRect(16, 176 + this.topOffset, 306, 142, 12);
    this.missionPanel.lineStyle(2, 0xfacc15, 0.3);
    this.missionPanel.strokeRoundedRect(16, 176 + this.topOffset, 306, 142, 12);

    this.missionTexts.forEach((text, index) => {
      const mission = missions[index];
      if (!mission) {
        text.setText("");
        return;
      }

      const icon = mission.isFlash ? "⚡" : mission.completed ? "★" : index === 1 ? "✦" : "★";
      text.setColor(mission.completed ? "#86efac" : "#fff7ed");
      const timer = mission.isFlash && typeof mission.remainingSeconds === "number" ? ` ${mission.remainingSeconds}s` : "";
      text.setText(`${icon} ${mission.label} ${mission.progress}/${mission.target}${timer}`);
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
    graphics.fillRoundedRect(centerX - 170, 156 + this.topOffset, 340, 58, 18);
    graphics.lineStyle(4, 0xfacc15, 0.72);
    graphics.strokeRoundedRect(centerX - 170, 156 + this.topOffset, 340, 58, 18);
  }
}

