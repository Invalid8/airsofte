import type { EnemyType, WaveTemplate } from '$lib/types/gameTypes'

export const WAVE_TEMPLATES: readonly WaveTemplate[] = [
  {
    id: 0,
    enemies: [
      { type: 'BASIC' as EnemyType, count: 5, spawnDelay: 500, pattern: 'STRAIGHT' as const }
    ],
    spawnInterval: 1000
  },
  {
    id: 1,
    enemies: [
      { type: 'BASIC' as EnemyType, count: 4, spawnDelay: 400, pattern: 'WAVE' as const },
      { type: 'SCOUT' as EnemyType, count: 2, spawnDelay: 600, pattern: 'ZIGZAG' as const }
    ],
    spawnInterval: 900
  },
  {
    id: 2,
    enemies: [
      { type: 'SCOUT' as EnemyType, count: 6, spawnDelay: 300, pattern: 'WAVE' as const },
      { type: 'BASIC' as EnemyType, count: 3, spawnDelay: 500, pattern: 'STRAIGHT' as const }
    ],
    spawnInterval: 800
  },
  {
    id: 3,
    enemies: [
      { type: 'BOMBER' as EnemyType, count: 2, spawnDelay: 1000, pattern: 'STRAIGHT' as const },
      { type: 'SCOUT' as EnemyType, count: 4, spawnDelay: 400, pattern: 'CIRCLE' as const }
    ],
    spawnInterval: 700
  },
  {
    id: 4,
    enemies: [{ type: 'BOSS' as EnemyType, count: 1, spawnDelay: 0, pattern: 'CIRCLE' as const }],
    spawnInterval: 600
  }
] as const
