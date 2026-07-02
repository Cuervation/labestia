import Phaser from "phaser";
import { ASSET_KEYS } from "../config/assets";
import type { VehicleKind } from "../types";

type AudioKind = "hit" | "police" | "gameOver" | "whistle";

const FREQUENCIES: Record<AudioKind, number[]> = {
  hit: [120, 78],
  police: [260, 390, 520],
  gameOver: [180, 120, 80],
  whistle: [920, 1180, 980],
};

export class AudioSystem {
  private context?: AudioContext;
  private enabled = true;

  constructor(private readonly scene?: Phaser.Scene) {}

  playHit(kind: VehicleKind, _comboMultiplier: number) {
    this.play(kind === "policeCar" ? "police" : "hit");
  }

  playGameOver() {
    this.play("gameOver", 0.07);
  }

  playWhistle() {
    if (this.scene?.cache.audio.exists(ASSET_KEYS.whistle)) {
      this.scene.sound.play(ASSET_KEYS.whistle, { volume: 0.65 });
      return;
    }

    this.play("whistle", 0.03);
  }

  private play(kind: AudioKind, volume = 0.045) {
    if (!this.enabled) {
      return;
    }

    try {
      const context = this.ensureContext();
      if (!context) {
        return;
      }

      if (context.state === "suspended") {
        void context.resume().catch(() => {
          this.enabled = false;
        });
      }

      const now = context.currentTime;
      FREQUENCIES[kind].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = now + index * 0.075;
        const end = start + 0.1;

        oscillator.type = kind === "whistle" ? "sine" : "square";
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(end + 0.02);
      });
    } catch {
      this.enabled = false;
    }
  }

  private ensureContext() {
    if (this.context) {
      return this.context;
    }

    const AudioContextConstructor = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextConstructor) {
      this.enabled = false;
      return undefined;
    }

    this.context = new AudioContextConstructor();
    return this.context;
  }
}
