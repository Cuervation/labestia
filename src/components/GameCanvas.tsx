import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { createLaBestiaGame } from "../game/LaBestiaGame";

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) {
      return;
    }

    gameRef.current = createLaBestiaGame(containerRef.current);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="game-canvas" aria-label="La Bestia game canvas" />;
}