Original prompt: Actuá como Agent 5 - QA / Build. Leer todo el repo y dejar el proyecto estable y compilando.

## QA Progress
- Inicio QA/build.
- Repo leído.
- Pendiente: npm install, typecheck, build, fixes mínimos.

- Fixed package.json UTF-8 BOM that broke Vite/PostCSS config scan.

- Added Firestore rules and removed silent auth profile update catch.

- Ran npm audit fix --force for Vite/esbuild dev-server vulnerability, then queued full revalidation.

- QA passed: npm run typecheck, npm run build, npm audit, npm run dev smoke / and /play HTTP 200.

- Implemented gameplay V0.2 systems: scoring, traffic, player, HUD, effects, Bestia Mode, police, floating scores, difficulty phases.

- Switched Phaser renderer from AUTO to CANVAS after headless screenshot showed black WebGL canvas while state was running.

- Moved player-center/left/right PNGs into public/assets.
- Wired Phaser boot loading for PNG vs SVG assets.
- Player now switches textures by horizontal direction and stays in the lower half via horizontal-only movement.
- Pending: run dev/playtest to verify textures and collisions, then leave notes if any tuning is needed.


- Verified in Playwright: player stays in lower half, moves horizontally, and asset loading works from public/assets.

- Added window key listeners in PlayerSystem as input fallback; Playwright keyboard input now drives horizontal movement reliably.\n- Verified with Playwright that the truck moves left/right and returns to center after release.


- Moved portada.png into public/assets and replaced HomePage with fullscreen cover image plus JUGAR link to /play.


- Verified portada home with Playwright: image visible, topbar hidden, JUGAR visible, click navigates to /play, no console errors.


- Adjusted player sprite to use uniform scale instead of deforming setDisplaySize; keeps original sprite aspect ratio and makes La Bestia visibly larger.


- Tuned player spriteScale to 0.42 after visual check; truck is larger and preserves original aspect ratio.


- Updated portada cover image to object-fit: contain so the full mobile-oriented image is visible without cropping or distortion.


- Aligned portada contain image to top for mobile so the complete artwork is visible without top letterbox; verified JUGAR navigation.


- Unified gameOver payload to carsDestroyed + durationSeconds, removed empty ranking column, and aligned Firebase docs/skill text to scores.
- typecheck and build passed after fixing PlayerSystem literal typing and GameOverPanel encoding.


- Playtest Polish V0.3: tuned player speed, combo window, Bestia threshold, traffic pacing, HUD labels, collision feedback, and React-side restart without full app reload.

- Fixed traffic spawn/playtest issue by creating vehicles through the Arcade group and manually stepping Arcade physics in the deterministic advanceTime hook.

- Smoke tested /play: movement works, traffic collides, score increases, timer reaches game over, and Jugar de nuevo remounts the game.


- Firebase Real Test prep: tightened firestore.rules for users/scores/leaderboard, documented .env.local setup, Hosting deploy and Firestore rules deploy.

- Verified no .env.local is present in workspace and Firebase CLI is not installed globally; real Firebase login/ranking test requires local credentials and CLI.


- Gameplay Feel + Visual Identity V0.3: added touch left/right controls via laBestia:playerControl event, keeping PlayerSystem as the single movement owner.

- Improved road visuals with sidewalks, dashed lanes, curbs, crosswalk, potholes/sign details drawn in Phaser graphics.

- Improved HUD readability, initial instruction, impact feedback, mobile canvas fit, and reliable in-flow game over restart panel.

- Smoke tested /play: desktop keyboard, mobile controls, traffic, collisions, score/combo, timer/game over, and restart.


- Assets + Art Pass V0.4: replaced enemy vehicle placeholder SVGs with lightweight top-down arcade art, improved explosion placeholder, tuned traffic display sizes, and upgraded fallback vehicle graphics.

- Added barrio art-pass details in Phaser graphics: cones, bins, lane/crosswalk/street sign accents without external assets.

- Smoke tested /play: player and traffic assets load, no asset/page errors, game keeps running, collision increases score/combo, HUD remains readable.


- Juice / Polish V0.6: added countdown start state (3, 2, 1, YA) via GameStateSystem; player/traffic/scoring stay paused until running.

- Added AudioSystem WebAudio fallback beeps for hit/combo/Bestia/game over, safe when audio is blocked.

- Improved impact juice: stronger shake/flash, larger sparks, clearer floating text, Bestia aura/burst/HUD highlight, and Phaser game-over overlay with final stats.

- Fixed combo timing to use ScoringSystem elapsed game time instead of Phaser scene time, then tuned combo window/Bestia threshold so Bestia Mode appears in real play.

- Smoke tested /play: countdown blocks movement/spawns, game starts, movement works, collisions score, combo/Bestia appears, timer ends, game over shows stats, restart remounts cleanly, no page errors.


- Game Loop / Progression V0.8: added MissionSystem with three fixed objectives: Romper 8 autos, Combo x4, Bestia Mode.

- Mission bonuses live in balance.ts and are applied through ScoringSystem.addBonus without changing base score/combo rules.

- HUD now shows active objective progress; Phaser and React game over show completed objectives summary.

- Smoke tested /play: objectives appear, combo/Bestia missions complete, bonus score applies, game over shows objectives, restart resets missions, no page errors.


- Balancing / Difficulty V0.9: tuned combo/Bestia/score/missions and difficulty pacing for a clearer 90s arcade curve.

- Moved difficulty phase thresholds and traffic collider ratios into balance.ts; removed unused policeSpawnAfterSeconds config.

- Added traffic firstSpawnDelayMs so the first post-countdown beat stays readable before traffic starts.

- Smoke tested /play: easy start, medium/chaos observed, collisions score, combo/Bestia/missions work, game over/restart work, no page errors.


- QA MVP Freeze V1.0: started freeze pass without touching Firebase/gameplay/assets; typecheck passed before documentation updates.
- Freeze documentation updated in README and CODEX_HANDOFF to reflect current MVP: portada, countdown, desktop/mobile controls, missions, Bestia Mode, game over/restart, Firebase bridge prepared.


- QA MVP Freeze V1.0 validation passed: / portada loads with JUGAR, /play enters countdown/running, desktop/mobile controls move and release to center, collisions add score, game over appears, restart keeps one canvas, and mobile controls display.
- Final checks passed: npm run typecheck and npm run build. Build keeps the existing Vite chunk-size warning for the large Phaser/Firebase bundle.


- MVP Offline / Local Game Mode V1.1: added localStorage score/ranking path for missing Firebase config or no-login sessions.
- React remains the persistence owner after laBestia:gameOver; Phaser still does not import Firebase or localStorage.


- Offline V1.1 validation passed without .env Firebase: / loads, /play local mode appears, game over saves local score, /ranking shows local leaderboard, second score persists, no Firebase console noise.
- Final checks passed: npm run typecheck and npm run build; existing Vite chunk-size warning remains non-blocking.


- Firebase V1.3 prep: restored .env.example to placeholders, added .env.local.example, removed auth alerts in favor of inline messages, and extended Firestore score/leaderboard data with carsDestroyed.
- Important gotcha: .env files written with UTF-8 BOM made Vite ignore VITE_FIREBASE_* and forced the app back into modo local; rewrote env examples/local file as UTF-8 without BOM.
- Smoke: without .env.local the local fallback still works; with .env.local the app boots in modo practica with Google login CTA. Real Auth/Firestore flow remains pending until Firebase Console is enabled.


- Firebase Hosting Deploy + Production QA V1.4: documented deploy flow for Hosting + Firestore rules, added deploy:rules script, and documented production checks for SPA routes and authorized domains.
- Verified current repo locally: typecheck/build pass, firebase.json serves dist with SPA rewrite, and this environment lacks Firebase CLI so real deploy must be run manually after firebase login + firebase use --add.

- Gameplay visual pass: HUD restyled toward the mobile mock with black top bar/logo/timer/score/combo, street background gained cobblestone/vereda/arboles/details, and mobile touch buttons were restyled as circular arcade controls. Typecheck passed; visual smoke captured /play with Playwright.
