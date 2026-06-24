import Phaser from "phaser";
import { ASSET_KEYS } from "../config/assets";

export class EffectsSystem {
  constructor(private readonly scene: Phaser.Scene) {}

  sparks(x: number, y: number) {
    for (let index = 0; index < 10; index += 1) {
      const particle = this.scene.add.circle(x, y, Phaser.Math.Between(2, 4), 0xfacc15, 1);
      particle.setDepth(30);
      this.scene.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-42, 42),
        y: y + Phaser.Math.Between(-42, 42),
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(220, 420),
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

  explosion(x: number, y: number) {
    if (this.scene.textures.exists(ASSET_KEYS.explosion)) {
      const explosion = this.scene.add.image(x, y, ASSET_KEYS.explosion).setDisplaySize(92, 92);
      explosion.setDepth(25);
      this.scene.tweens.add({
        targets: explosion,
        alpha: 0,
        scale: 1.45,
        duration: 360,
        onComplete: () => explosion.destroy(),
      });
      return;
    }

    const burst = this.scene.add.circle(x, y, 20, 0xf97316, 0.85).setDepth(25);
    this.scene.tweens.add({
      targets: burst,
      alpha: 0,
      scale: 2.8,
      duration: 320,
      onComplete: () => burst.destroy(),
    });
  }

  floatingText(x: number, y: number, text: string, color = "#ffffff") {
    const label = this.scene.add
      .text(x, y, text, {
        color,
        fontFamily: "Arial, sans-serif",
        fontSize: "26px",
        fontStyle: "bold",
        stroke: "#111111",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(50);

    this.scene.tweens.add({
      targets: label,
      y: y - 54,
      alpha: 0,
      duration: 760,
      ease: "Quad.easeOut",
      onComplete: () => label.destroy(),
    });
  }
}
