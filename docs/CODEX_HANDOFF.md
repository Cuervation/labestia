# Handoff — La Bestia

Estado de referencia para continuar en una nueva sesión de Codex sin perder contexto.

## Snapshot actual

- El repo tiene el flujo actual de portada mobile + juego + Firebase ya armado.
- La base técnica ya existe: React + TypeScript + Vite + Phaser + Firebase + Zustand.
- El gameplay queda congelado como MVP V1.0 para seguir luego con Firebase real/ranking/deploy.
- V1.1 agrega modo local offline: sin `VITE_FIREBASE_*`, la partida se guarda en `localStorage` y el ranking muestra top 20 local.
- El juego ya tiene loop funcional tipo arcade y el flujo de guardado/ranking está integrado desde React.
- La portada principal ya usa la imagen `portada.png` con botón JUGAR.
- En el freeze no se agregaron features nuevas; sólo se validó estado y se actualizó documentación.

## Qué se implementó hasta ahora

- Scaffold inicial del proyecto y separación por capas.
- Gameplay MVP V1.0 con:
  - movimiento del vehículo del jugador,
  - controles desktop y mobile,
  - countdown inicial,
  - tráfico/autos,
  - colisiones,
  - score y combo,
  - temporizador,
  - Bestia Mode,
  - policía como obstáculo especial,
  - objetivos/misiones simples con bonus,
  - efectos visuales,
  - feedback de impacto,
  - game over con resumen y reinicio,
  - HUD.
- Integración Firebase para:
  - autenticación con Google,
  - guardado de partidas en `scores`,
  - actualización de leaderboard,
  - lectura del top ranking.
- Modo local offline para:
  - jugar sin Firebase configurado,
  - guardar score local,
  - ver ranking local,
  - jugar de nuevo sin credenciales.
- Documentación base:
  - arquitectura,
  - spec del juego,
  - modelo Firebase,
  - balance,
  - deploy,
  - roadmap,
  - prompts de referencia.
- Assets placeholder preparados para no depender de sprites finales.

## Qué agentes/prompts ya se ejecutaron

| Agente / prompt | Resultado |
|---|---|
| Agent 1 - Bootstrap Architect | Base React/TS/Vite/Phaser preparada y separada por capas. |
| Agent 3 - Firebase | Auth, Firestore, guardado de partidas y ranking global. |
| Agent 5 - QA / Build | Estabilización general, typecheck/build/dev smoke y fixes mínimos. |
| Gameplay V0.2 | Sistemas de score, tráfico, HUD, efectos, Bestia Mode y policía. |
| Gameplay Feel / Art / Juice / Progression / Balance | Controles mobile, calle arcade, mejores placeholders, countdown, misiones, Bestia Mode visible, game over/restart y balance V0.9. |
| QA MVP Freeze V1.0 | Validación de arquitectura/build/smoke y documentación de estado congelado. |
| Asset prep | Placeholders SVG y documentación de assets. |
| Skills / conventions | Skills reutilizables y convención del proyecto para trabajo futuro. |

## Archivos importantes

| Archivo | Para qué sirve |
|---|---|
| `src/app/App.tsx` | Router simple por pathname y bootstrap de auth store. |
| `src/pages/PlayPage.tsx` | Pantalla de juego y puente entre Phaser y Firebase. |
| `src/game/LaBestiaGame.ts` | Configuración principal de Phaser. |
| `src/game/scenes/GameScene.ts` | Loop principal, colisiones, game over y hooks de debug. |
| `src/game/systems/*` | Sistemas de player, tráfico, score, HUD, efectos, audio, estado y misiones. |
| `src/firebase/*` | Auth, Firestore, leaderboard y tipos. |
| `src/storage/localScores.ts` | Ranking local offline basado en `localStorage`. |
| `src/store/authStore.ts` | Estado de sesión y login/logout. |
| `docs/ARCHITECTURE.md` | Reglas de separación React / Phaser / Firebase. |
| `docs/GAME_SPEC.md` | Qué es el juego y qué queda fuera de alcance. |
| `docs/FIREBASE_MODEL.md` | Colecciones y modelo de datos. |
| `docs/DEPLOY.md` | Flujo de deploy con Firebase Hosting. |
| `docs/PROMPTS.md` | Prompts de referencia del proyecto. |
| `progress.md` | Resumen corto del progreso y de la última etapa QA. |
| `public/assets/placeholders/*` | Sprites SVG provisionales. |

## Qué está funcionando

- La app arranca en React y monta el juego Phaser dentro de la página de play.
- El juego corre con canvas y escala adaptativa.
- Hay loop de juego jugable con countdown, score/combo/tiempo, misiones, Bestia Mode y game over.
- El reinicio remonta `GameCanvas` por `key`, evitando duplicar instancias Phaser.
- `window.render_game_to_text` y `window.advanceTime` permiten smoke/playtest determinístico.
- El evento de game over dispara guardado de partida cuando hay usuario logueado.
- El leaderboard se actualiza al cerrar una partida válida.
- Sin Firebase configurado o sin login, el score se guarda localmente en este navegador.
- Los placeholders permiten seguir iterando sin arte final.

## Qué falta hacer

- Validar el flujo real con credenciales Firebase correctas.
- Preparar ranking/deploy definitivo.
- Revisar ajustes finos de gameplay, balance o presentación sólo si el próximo objetivo lo pide.
- Llevar este estado a una sesión nueva sin re-derivar todo el contexto.

## Errores conocidos

- Si faltan las variables de entorno de Firebase, Auth/Firestore quedan inactivos y el flujo de guardado/ranking falla con mensajes explícitos.
- El guardado de perfil de usuario tolera fallos, pero reporta por consola cuando no puede actualizar.
- No hay otros errores bloqueantes documentados en este handoff.

## Próximo paso recomendado

Avanzar con Firebase real/ranking/deploy desde este MVP congelado, sin seguir moviendo gameplay en la misma tarea.

## Comandos para probar el proyecto

```bash
npm run dev
npm run typecheck
npm run build
npm run preview
npm run deploy:hosting
```

## Nota operativa

- No tocar gameplay, Firebase ni UI en esta sesión de handoff.
- No hacer refactors.
- No agregar features.
