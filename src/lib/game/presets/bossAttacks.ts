import type { BossAttackPreset } from '$lib/types/gameTypes'

export const BOSS_ATTACK_PRESETS: readonly BossAttackPreset[] = [
  {
    id: 'boss-wide-pressure',
    healthThreshold: 0.66,
    bulletCount: 3,
    spread: 28,
    intervalMultiplier: 1,
    speedMultiplier: 1,
    aimed: false
  },
  {
    id: 'boss-aimed-burst',
    healthThreshold: 0.33,
    bulletCount: 5,
    spread: 36,
    intervalMultiplier: 0.85,
    speedMultiplier: 1.12,
    aimed: true
  },
  {
    id: 'boss-final-pattern',
    healthThreshold: 0,
    bulletCount: 6,
    spread: 48,
    intervalMultiplier: 0.8,
    speedMultiplier: 1.18,
    aimed: true
  }
] as const
