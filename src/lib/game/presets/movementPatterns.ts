import type { MovementPattern } from '$lib/types/gameTypes'

export const MOVEMENT_PATTERN_PRESETS: Partial<Record<
  MovementPattern,
  {
    amplitude?: number
    frequency?: number
    radius?: number
  }
>> = {
  WAVE: {
    amplitude: 50,
    frequency: 0.02
  },
  ZIGZAG: {
    amplitude: 60,
    frequency: 0.03
  },
  CIRCLE: {
    radius: 100
  },
  SPIRAL: {
    radius: 150
  }
} as const
