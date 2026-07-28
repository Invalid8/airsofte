import type { BossAttackPreset } from '$lib/types/gameTypes'

export const BOSS_ATTACK_PRESETS: readonly BossAttackPreset[] = [
  {
    id: 'boss-wide-pressure',
    healthThreshold: 0.66,
    bulletCount: 3,
    spread: 28,
    intervalMultiplier: 1,
    speedMultiplier: 1,
    aimed: false,
    movementPattern: 'CIRCLE',
    minY: 48,
    maxY: 230
  },
  {
    id: 'boss-aimed-burst',
    healthThreshold: 0.33,
    bulletCount: 4,
    spread: 32,
    intervalMultiplier: 1,
    speedMultiplier: 1.08,
    aimed: true,
    movementPattern: 'CIRCLE',
    minY: 48,
    maxY: 245
  },
  {
    id: 'boss-final-pattern',
    healthThreshold: 0,
    bulletCount: 3,
    spread: 42,
    intervalMultiplier: 1.08,
    speedMultiplier: 1.12,
    aimed: true,
    movementPattern: 'CHASE',
    minY: 54,
    maxY: 260
  }
] as const
