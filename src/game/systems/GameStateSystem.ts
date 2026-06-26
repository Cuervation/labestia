import Phaser from "phaser";
import { GAME_BALANCE } from "../config/balance";
import type { GameSessionState } from "../types";

export class GameStateSystem {
  private state: GameSessionState = "countdown";
  private elapsedMs = 0;
  private readonly overlay: Phaser.GameObjects.Container;
  private readonly countdownText: Phaser.GameObjects.Text;
  private lastCountdownText = "";

  constructor(private readonly scene: Phaser.Scene) {
    const centerX = scene.scale.width / 2;
    const centerY = scene.scale.height / 2;
    const panel = scene.add
      .rectangle(centerX, centerY, scene.scale.width, scene.scale.height, 0x050505, 0.48)
      .setDepth(130);
    const titleText = scene.add
      .text(centerX, centerY - 118, "PREPARADO PARA\nROMPER TODO", {
        color: "#fff7ed",
        fontFamily: "Arial, sans-serif",
        fontSize: "38px",
        fontStyle: "bold",
        align: "center",
        stroke: "#111111",
        strokeThickness: 7,
        wordWrap: { width: scene.scale.width - 56 },
      })
      .setOrigin(0.5)
      .setDepth(131);

    this.countdownText = scene.add
      .text(centerX, centerY - 24, "3", {
        color: "#facc15",
        fontFamily: "Arial, sans-serif",
        fontSize: "118px",
        fontStyle: "bold",
        stroke: "#7f1d1d",
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setDepth(131);

    const hintText = scene.add
      .text(centerX, centerY + 96, "Chocá todo en 90 segundos", {
        color: "#fff7ed",
        fontFamily: "Arial, sans-serif",
        fontSize: "30px",
        fontStyle: "bold",
        stroke: "#111111",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(131);

    this.overlay = scene.add.container(0, 0, [panel, titleText, this.countdownText, hintText]).setDepth(130);
    this.pulseCountdown("3");
  }

  get currentState() {
    return this.state;
  }

  get running() {
    return this.state === "running";
  }

  update(deltaMs: number) {
    if (this.state !== "countdown") {
      return;
    }

    this.elapsedMs += deltaMs;
    const index = Math.min(
      Math.floor(this.elapsedMs / GAME_BALANCE.start.countdownStepMs),
      GAME_BALANCE.start.sequence.length - 1,
    );
    const countdownText = GAME_BALANCE.start.sequence[index] ?? "YA";

    if (countdownText !== this.lastCountdownText) {
      this.pulseCountdown(countdownText);
    }

    if (this.elapsedMs >= GAME_BALANCE.start.sequence.length * GAME_BALANCE.start.countdownStepMs) {
      this.startRunning();
    }
  }

  finish() {
    this.state = "finished";
  }

  private pulseCountdown(text: string) {
    this.lastCountdownText = text;
    this.countdownText.setText(text);
    this.countdownText.setScale(0.65);
    this.countdownText.setAlpha(1);

    this.scene.tweens.add({
      targets: this.countdownText,
      scale: text === "YA" ? 1.28 : 1.1,
      duration: 180,
      ease: "Back.easeOut",
    });
  }

  private startRunning() {
    this.state = "running";
    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0,
      duration: 260,
      onComplete: () => this.overlay.destroy(true),
    });
  }
}
