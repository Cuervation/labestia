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

## Demo local sin Firebase

- Si no existe `.env.local`, el juego entra en modo local.
- Las partidas se guardan en `localStorage`.
- `/ranking` muestra top 20 local del navegador.
- El login no rompe la app: queda degradado como modo local.

## Configurar Firebase real

1. Copiar `.env.local.example` a `.env.local`.
2. Completar las variables `VITE_FIREBASE_*` con datos de tu Web App de Firebase.
3. Habilitar Google Sign-In en Firebase Authentication.
4. Crear Firestore y aplicar `firestore.rules`.
5. Guardar `.env.local` como UTF-8 sin BOM.

Mientras eso no exista, el fallback local sigue funcionando.

## Scripts

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run preview
npm run deploy:rules
npm run deploy:hosting
```

## Deploy Firebase Hosting

1. Configurar `.env.local` con `VITE_FIREBASE_*`.
2. Verificar Google Sign-In y Firestore en Firebase Console.
3. Correr:

```bash
npm run typecheck
npm run build
npm run preview
firebase login
firebase use --add
npm run deploy:rules
npm run deploy:hosting
```

En producción, revisar también **Authentication > Settings > Authorized domains** para que el dominio de Hosting permita Google Login.

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
