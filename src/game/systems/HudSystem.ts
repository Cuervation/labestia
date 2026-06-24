import Phaser from "phaser";
import { ScoringSystem } from "./ScoringSystem";

type HudText = Phaser.GameObjects.Text;

export class HudSystem {
  private readonly scoreText: HudText;
  private readonly timerText: HudText;
  private readonly comboText: HudText;
  private readonly bestiaText: HudText;
  private readonly difficultyText: HudText;

  constructor(scene: Phaser.Scene) {
    this.scoreText = scene.add.text(24, 18, "Score 0", this.style("#ffffff", 26));
    this.timerText = scene.add.text(scene.scale.width - 24, 18, "90s", this.style("#facc15", 26)).setOrigin(1, 0);
    this.comboText = scene.add.text(24, 54, "Combo x1", this.style("#fecaca", 20));
    this.bestiaText = scene.add.text(scene.scale.width / 2, 20, "", this.style("#facc15", 24)).setOrigin(0.5, 0);
    this.difficultyText = scene.add.text(scene.scale.width - 24, 54, "EASY", this.style("#ffffff", 18)).setOrigin(1, 0);

    [this.scoreText, this.timerText, this.comboText, this.bestiaText, this.difficultyText].forEach((text) => {
      text.setScrollFactor(0);
      text.setDepth(100);
    });
  }

  update(scoring: ScoringSystem) {
    this.scoreText.setText(`Score ${scoring.score}`);
    this.timerText.setText(`${Math.ceil(scoring.remainingSeconds)}s`);
    this.comboText.setText(`Combo x${Math.max(scoring.comboCount, 1)}`);
    this.difficultyText.setText(scoring.getDifficulty().toUpperCase());

    if (scoring.bestiaModeActive) {
      this.bestiaText.setText(`BESTIA MODE ${scoring.getBestiaRemainingSeconds()}s`);
      this.bestiaText.setScale(1 + Math.sin(Date.now() / 90) * 0.08);
      return;
    }

    this.bestiaText.setText("");
    this.bestiaText.setScale(1);
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
}
