import Phaser from "phaser";
import { ASSET_MANIFEST } from "../config/assets";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    for (const asset of ASSET_MANIFEST) {
      if (asset.path.endsWith(".svg")) {
        this.load.svg(asset.key, asset.path);
        continue;
      }

      this.load.image(asset.key, asset.path);
    }
  }

  create() {
    this.scene.start("GameScene");
  }
}
