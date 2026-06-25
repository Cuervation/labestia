# La Bestia

Arcade web top-down de autos hecho con React, TypeScript, Vite, Phaser, Firebase y Zustand.

## Estado actual

- Gameplay MVP V1.0 congelado para QA.
- Portada mobile integrada como pantalla principal.
- Phaser montado dentro de la vista de juego.
- Firebase integrado para login y persistencia.
- Ranking preparado con leaderboard global.
- Modo local offline con ranking en `localStorage` cuando Firebase no esta configurado.
- Eventos de fin de partida conectan Phaser con React.

## Gameplay

- Partidas de 90 segundos.
- Camioneta roja de fletes como jugador.
- Countdown inicial, controles desktop/mobile, trafico, obstaculos/policia, colisiones, score y combo.
- Bestia Mode, objetivos simples por partida y feedback visual arcade.
- Game over con resumen y boton para jugar de nuevo.
- Guardado de puntaje al finalizar si hay sesion iniciada.
- Sin Firebase/login, el puntaje se guarda localmente en este navegador.

## Firebase

- Auth con Google.
- Guardado de partidas en `scores`.
- Leaderboard en `leaderboard`.
- No guardar score si no hay usuario logueado.
- Si faltan variables `VITE_FIREBASE_*`, la app usa ranking local y no requiere credenciales.

## Scripts

```bash
npm run dev
npm run typecheck
npm run build
npm run preview
npm run deploy:hosting
```

## Estructura

```txt
src/
  app/
  pages/
  components/
  firebase/
  store/
  game/
    config/
    scenes/
    entities/
    systems/
    types/
  styles/
```

## Docs

Ver `docs/` para spec, arquitectura, Firebase, balance, deploy y roadmap.
