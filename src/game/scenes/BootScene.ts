import Phaser from "phaser";
import { BOOT_ASSETS, type GameAsset } from "../config/assets";

const LOAD_START_KEY = "laBestia:minimalPreloadStartedAtMs";

function loadAsset(scene: Phaser.Scene, asset: GameAsset) {
  if (scene.textures.exists(asset.key)) {
    return;
  }

  if (asset.path.endsWith(".svg")) {
    scene.load.svg(asset.key, asset.path);
    return;
  }

  if (asset.path.endsWith(".ogg") || asset.path.endsWith(".mp3") || asset.path.endsWith(".wav")) {
    scene.load.audio(asset.key, asset.path);
    return;
  }

  scene.load.image(asset.key, asset.path);
}

export class BootScene extends Phaser.Scene {
  private preloadStartedAtMs = 0;

  constructor() {
    super("BootScene");
  }

  preload() {
    this.preloadStartedAtMs = performance.now();
    this.registry.set(LOAD_START_KEY, this.preloadStartedAtMs);

    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#050505");
    const loadingText = this.add
      .text(width / 2, height / 2 - 48, "CARGANDO...", {
        color: "#fff7ed",
        fontFamily: "Press Start 2P, monospace",
        fontSize: "34px",
        stroke: "#111111",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    const barBack = this.add.rectangle(width / 2, height / 2 + 12, 320, 18, 0x111111, 0.9);
    barBack.setStrokeStyle(2, 0xfacc15, 0.8);
    const barFill = this.add.rectangle(width / 2 - 160, height / 2 + 12, 0, 14, 0xfacc15, 1).setOrigin(0, 0.5);
    const percentText = this.add
      .text(width / 2, height / 2 + 52, "0%", {
        color: "#facc15",
        fontFamily: "Press Start 2P, monospace",
        fontSize: "22px",
      })
      .setOrigin(0.5);

    this.load.on("progress", (progress: number) => {
      barFill.width = 320 * progress;
      percentText.setText(`${Math.round(progress * 100)}%`);
    });

    this.load.once("complete", () => {
      const elapsed = Math.round(performance.now() - this.preloadStartedAtMs);
      console.info(`[LOAD] BootScene minimal preload ${elapsed}ms (${BOOT_ASSETS.length} assets)`);
      loadingText.setText("LISTO");
    });

    BOOT_ASSETS.forEach((asset) => loadAsset(this, asset));
  }

  create() {
    this.scene.start("GameScene");
  }
}
