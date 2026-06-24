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
