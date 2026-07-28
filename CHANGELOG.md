# Changelog

## 1.1.3

- Migrated the desktop shell to Tauri while keeping the web build as the source of truth.
- Consolidated gameplay runtime around the canvas-first loop.
- Fixed life loss, respawn stability, shield/invincibility stacking, boss health visibility, and wave progression.
- Added object-pool and runtime smoke coverage for boss stress, power-ups, collision, story completion, and game over.
- Moved wave, enemy, weapon, power-up, movement, and boss behavior tuning into presets.
- Removed Electron wiring and unused assets.
