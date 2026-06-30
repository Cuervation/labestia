import { BOOT_ASSETS } from "../game/config/assets";

const CRITICAL_GAME_IMAGES = BOOT_ASSETS.map((asset) => asset.path);

let preloadStarted = false;

export function preloadCriticalGameAssets() {
  if (preloadStarted) {
    return;
  }

  preloadStarted = true;

  const preload = () => {
    CRITICAL_GAME_IMAGES.forEach((src) => {
      const image = new Image();
      image.decoding = "async";
      image.src = src;
    });
  };

  const requestIdleCallback = window.requestIdleCallback;
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(preload, { timeout: 2500 });
    return;
  }

  globalThis.setTimeout(preload, 250);
}
