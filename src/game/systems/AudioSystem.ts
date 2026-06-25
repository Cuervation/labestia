import type { VehicleKind } from "../types";

type AudioKind = "hit" | "combo" | "bestia" | "gameOver";

const FREQUENCIES: Record<AudioKind, number[]> = {
  hit: [120, 78],
  combo: [260, 390, 520],
  bestia: [220, 330, 660],
  gameOver: [180, 120, 80],
};

export class AudioSystem {
  private context?: AudioContext;
  private enabled = true;

  playHit(kind: VehicleKind, comboMultiplier: number) {
    if (comboMultiplier >= 4) {
      this.play("combo");
      return;
    }

    this.play(kind === "policeCar" ? "combo" : "hit");
  }

  playBestiaMode() {
    this.play("bestia", 0.08);
  }

  playGameOver() {
    this.play("gameOver", 0.07);
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

        oscillator.type = kind === "bestia" ? "sawtooth" : "square";
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
