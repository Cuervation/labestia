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

- Production polish: fixed mujer street event visibility by spawning it lower on the sidewalk and slightly increasing scale.
- Production polish: moved the FIUUUU dialog to the player's front driver-window area and kept it following La Bestia while visible.
- Production polish: compact ranking popup now shows only POS/JUGADOR/PUNTAJE, with button-like arcade styling and numeric columns using a legible font so scores render correctly.
- Validation: npm run typecheck and npm run build passed; Playwright smoke verified /play, mujer visibility, FIUUUU bubble screenshot, and ranking popup score visibility.

- HUD QA: detected top-hud-frame.png has transparent top padding (alpha bbox starts at y=198), so moved Phaser HUD group up with topOffset -66 and shifted timer/score left to avoid clipping.

- Refactor scoring in progress: replaced old temporal combo/Bestia/rider mission scoring with one active random perfect-sequence mission and x10 completion scoring. Pending typecheck/build/smoke.

- Refactor scoring validated: npm run typecheck and npm run build passed; browser smoke showed active random mission in HUD and MissionSystem browser check verified correct progress, wrong hit reset, completion score subtotal*x10, and new mission generation.

- Timer fix in progress: ScoringSystem now starts from performance.now when countdown reaches running and computes elapsed from real time instead of Phaser delta.

- Timer fix validated: npm run typecheck and npm run build passed; ScoringSystem browser check confirmed no elapsed before start, 20s real-time skip lowers timer to 70s, >90s marks finished; /play smoke confirmed timer drops after running.

- Cache optimization: added Firebase Hosting cache headers, Home idle preload for critical game images, and lazy MP3 loading with preload=none. Validated firebase.json JSON, npm run typecheck, npm run build, and Playwright smoke: MP3 not loaded on home, all 12 critical assets preloaded, /play canvas mounts, no console errors.

- Startup optimization validated: Home -> /play now supports same-document navigation, BootScene loads only 13 critical assets, GameScene creates only visible road tiles from loaded streets, and street_003-street_011 load in background. Validated npm run typecheck, npm run build, Playwright smoke for /play direct/internal navigation, visual screenshots, and restart overlay remount.

- Startup optimization follow-up: Layout header links now use the same internal navigate helper, so hidden/desktop nav links also avoid full document reload. Final smoke confirmed same-document marker persisted, /play direct loaded one canvas, restart left one canvas and no overlay, and [LOAD] logs showed GameScene.create before background streets completed.

- Mission scoring rule update: base points now add to score for every modeled car hit; target hits also advance mission progress/subtotal; non-target hits keep current progress/subtotal and return nonTarget instead of broken; CADENA ROTA feedback removed. Validated npm run typecheck, npm run build, direct browser module test for MissionSystem/ScoringSystem, and /play smoke screenshot.

- Traffic safety update: added safePassageWindowPx/maxBlockedLanesInWindow/spawnSkipIfNoSafeLane to GAME_BALANCE.traffic; TrafficSystem now picks lanes with guaranteed passage, skips spawn if it would block all 3 lanes, and enforces the invariant during update by removing the newest blocker if convergence creates a 3-lane wall. Validated npm run typecheck, npm run build, Playwright smoke screenshot, virtual no-wall sampling, and direct helper tests for skip/allow/enforce behavior.

- Local font pass: downloaded self-hosted TTFs for Bungee, Luckiest Guy, Teko SemiBold, Russo One, and Press Start 2P into public/assets/fonts; moved Another Danger references to the same lowercase fonts path; added src/styles/fonts.css with font-display: swap. Applied Bungee to main buttons, Luckiest Guy to mission/HUD objective text, Teko to HUD numeric/floating text, Russo One to panels/ranking/game over, and Press Start 2P to BootScene loading. Validated npm run typecheck, npm run build, Playwright screenshots for home/play/gameover/ranking, local font requests, and zero Google Fonts runtime requests.

- Combo/cadena collision rule: restored non-target vehicle hits to break the active mission chain after base score is awarded. MissionSystem now returns broken with chainWasActive, resets progress/subtotal, and GameScene shows base points plus CADENA CORTADA only when there was active progress. Validated npm run typecheck and browser module test: target hit advanced to 1, other car added base points and reset progress/subtotal to 0, next target restarted at 1. No build run per current AGENTS instruction.

- Lane change volantazo: PlayerSystem now interpolates one-lane moves over 140ms with an 80ms cooldown, consumes blocked/opposite inputs so held keys do not queue extra lane changes, preserves mobile `laBestia:playerControl`, and keeps final X snapped to the lane center. `npm run typecheck` passed; Playwright smoke began but the runner hung, so manual/browser smoke remains recommended. No build run per current AGENTS instruction.

- Traffic spawn intelligence: GameScene now passes the player's current lane into TrafficSystem; TrafficSystem scores spawn candidates with player-lane pressure plus lane-variety debt, then still rejects candidates that break dodge-route safety. Isolated validation confirmed fixed-center and fixed-side player lanes use all 3 lanes while prioritizing the player's lane. `npm run typecheck` passed; Playwright smoke runner hung again, so manual video smoke remains recommended. No build run per current AGENTS instruction.

- Traffic Director refinement: TrafficSystem now builds safe spawn lanes before choosing, rejects same-lane spawns that are too close, blocks fast catch-up behind slower cars unless the gap is large, weights safe lanes by player pressure/starvation/variety, and caps speed behind slower traffic when needed. Validated with `npm run typecheck` plus direct helper simulation for unsafe lane rejection, catch-up, full-block walls, and safe stagger. No build run per current AGENTS instruction.

- SuperJackpot mode: replaced visible random model missions with a final 20s SuperJackpot objective. The HUD now shows SuperJackpot progress 0/50 and prize x2; TrafficSystem schedules 50 final-phase spawns at 400ms intervals with police chance included; hitting 50 vehicles during the phase doubles the current score through ScoringSystem.multiplyScore. Validated npm run typecheck, direct timing check for 50 spawns over 20s, direct x2 score check, and grep confirmed old mission/combo strings are gone. No build run per current AGENTS instruction.

- SuperJackpot 60s revision: changed game duration to 60 seconds, kept a single mission active for the whole run, and doubled traffic speed globally for more difficulty. SuperJackpot remains the only visible objective and still doubles current score on completion. Validated with npm run typecheck; build/deploy remain blocked by the repo instruction not to run build after changes.

- Latest tuning: SuperJackpot target increased to 55 cars across the full 60s run, spawn cadence retuned to keep the objective spread across the whole match, and lane-change volantazo speed doubled again by halving the base lane-change duration to 70ms. Pending: typecheck smoke after the balance update.

- Follow-up fix: the visible world scroll was still using a hardcoded 220px/s, so the facades felt unchanged. Updated road scroll speed to derive from player base speed * 2, which makes the whole run feel faster in motion as requested.

- SuperJackpot scale-up: doubled the total target to 110 cars and halved the spawn interval so the objective density matches the new count across the same 60s run. Pending validation: typecheck and in-game pacing check.

- UI change: SuperJackpot HUD no longer shows numeric progress or prize text. It now displays only the word SUPERJACKPOT as segmented letters that light up progressively, and the game-over panel no longer repeats SuperJackpot progress.

- Balance correction: SuperJackpot target restored to 60 cars and spawn cadence normalized back to 1s so the objective reads cleanly as a full-run target instead of an inflated count.

- Balance tweak: increased SuperJackpot cars by 10% (60 -> 66) and police chance by 20% relative (0.24 -> 0.288) to make the full-run objective denser without changing the mode structure.

- HUD tweak: restored SuperJackpot numeric progress text below the segmented label while keeping the word-as-bar visual treatment.

- Balance reset: returned match duration to 90 seconds and retuned SuperJackpot to 58 total captures (cars + police), with a slower spawn cadence so the total lands in the requested 55-60 window across the whole run.

- Correction: SuperJackpot progress now counts only non-police car captures. Police still spawn and score, but they do not advance the 55-60 target.

- Spawn bugfix: the SuperJackpot traffic generator was counting police spawns against the quota, which starved the real car count. Switched the traffic-side counter to track cars and police separately, and shortened the spawn interval so 58 cars can actually appear within 90 seconds.

- Tutorial popup in progress: PlayPage now gates GameCanvas behind an OK tutorial modal with existing car/police/rider/mujer assets and arcade styling in global.css. Pending validation: typecheck and browser smoke. No build per current AGENTS instruction.

- Tutorial popup validation passed: npm run typecheck passed; browser smoke verified tutorial text/images/OK button, OK mounts one game canvas, no console errors; screenshots saved as tutorial-smoke-before.png and tutorial-smoke-after.png plus output/tutorial-smoke. No build run per current AGENTS instruction.
