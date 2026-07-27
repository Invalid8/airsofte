import type { PowerUpType } from '$lib/types/gameTypes'

export const POWERUP_CONFIG: Record<
  PowerUpType,
  {
    width: number
    height: number
    speed: number
    value: number
    duration?: number
    sprite: string
  }
> = {
  HEALTH: {
    width: 40,
    height: 40,
    speed: 2,
    value: 30,
    sprite: '$lib/assets/sprites/powerup-health.png'
  },
  WEAPON: {
    width: 40,
    height: 40,
    speed: 2,
    value: 0,
    duration: 15000,
    sprite: '$lib/assets/sprites/powerup-weapon.png'
  },
  SHIELD: {
    width: 40,
    height: 40,
    speed: 2,
    value: 0,
    duration: 10000,
    sprite: '$lib/assets/sprites/powerup-shield.png'
  },
  SPEED: {
    width: 40,
    height: 40,
    speed: 2,
    value: 1.5,
    duration: 8000,
    sprite: '$lib/assets/sprites/powerup-speed.png'
  },
  SCORE: {
    width: 40,
    height: 40,
    speed: 2,
    value: 500,
    sprite: '$lib/assets/sprites/powerup-score.png'
  }
}
