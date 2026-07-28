# Changelog

## 1.1.4

- Rewired Story Mode objectives, mission events, and persistent mission progress.
- Added live objective display to the in-game HUD.
- Preserved mission JSON events and rewards during mission loading.
- Added smoke coverage for story objective persistence and scripted mission power-up drops.

## 1.1.3

- Migrated the desktop shell to Tauri while keeping the web build as the source of truth.
- Consolidated gameplay runtime around the canvas-first loop.
- Fixed life loss, respawn stability, shield/invincibility stacking, boss health visibility, and wave progression.
- Added object-pool and runtime smoke coverage for boss stress, power-ups, collision, story completion, and game over.
- Moved wave, enemy, weapon, power-up, movement, and boss behavior tuning into presets.
- Removed Electron wiring and unused assets.
