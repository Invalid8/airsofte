# Airsofte

Airsofte is a web-first retro air combat shooter built with SvelteKit and packaged for desktop with Tauri. The browser build is the source of truth; desktop wraps the same static game build.

## Stack

- SvelteKit 2 and Svelte 5
- TypeScript
- Tauri 2
- Tailwind CSS 4
- GSAP
- Howler.js

## Run

```bash
npm install
npm run dev
```

Desktop dev:

```bash
npm run dev:tauri
```

## Verify

```bash
npm run typecheck
npm run audit:assets
npm run build
npm run build:tauri
```

`npm run build:tauri` currently builds Linux `.deb` and `.rpm` bundles.

## Project Layout

- `src/lib/game`: core gameplay systems, runtime, presets, collision, spawning, score, power-ups, and effects.
- `src/lib/components/game`: canvas game renderer, runtime host, and HUD.
- `src/lib/screens`: menu, story, game over, modal, and flow screens.
- `src/lib/assets`: game sprites, sound effects, music, and logo assets imported by the app.
- `static`: web/PWA static assets.
- `src-tauri`: desktop shell and bundle config only.

## Gameplay State

- Quick Play and Story Mode are active.
- Canvas runtime is the main game surface.
- Waves, enemies, movement patterns, weapons, power-ups, and boss phases are preset-driven.
- Lives, respawn, shield/invincibility, boss health visibility, wave progression, and boss stress are covered by smoke tests.

## Release

- Version: `1.1.3`
- Web build: `npm run build`
- Desktop build: `npm run build:tauri`
- Vercel config: `vercel.json`

## Notes

- Keep gameplay logic in `src/lib/game`.
- Keep Svelte components focused on rendering and state connection.
- Do not fork game logic for desktop; Tauri should remain a wrapper.
