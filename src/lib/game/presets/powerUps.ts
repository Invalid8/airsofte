import type { PowerUpType, WeaponType } from '$lib/types/gameTypes'

export const POWERUP_CONFIG: Record<
  PowerUpType,
  {
    width: number
    height: number
    speed: number
    value: number
    dropWeight: number
    duration?: number
    weaponChoices?: readonly WeaponType[]
    sprite: string
  }
> = {
  HEALTH: {
    width: 40,
    height: 40,
    speed: 2,
    value: 30,
    dropWeight: 0.16,
    sprite: '$lib/assets/sprites/powerup-health.png'
  },
  WEAPON: {
    width: 40,
    height: 40,
    speed: 2,
    value: 0,
    dropWeight: 0.28,
    duration: 15000,
    weaponChoices: ['DOUBLE', 'TRIPLE', 'SPREAD', 'NOSE_CANNON', 'SIDE_CANNONS'],
    sprite: '$lib/assets/sprites/powerup-weapon.png'
  },
  SHIELD: {
    width: 40,
    height: 40,
    speed: 2,
    value: 0,
    dropWeight: 0.2,
    duration: 10000,
    sprite: '$lib/assets/sprites/powerup-shield.png'
  },
  SPEED: {
    width: 40,
    height: 40,
    speed: 2,
    value: 1.5,
    dropWeight: 0.2,
    duration: 8000,
    sprite: '$lib/assets/sprites/powerup-speed.png'
  },
  SCORE: {
    width: 40,
    height: 40,
    speed: 2,
    value: 500,
    dropWeight: 0.16,
    sprite: '$lib/assets/sprites/powerup-score.png'
  },
  NOSE_CANNON: {
    width: 42,
    height: 42,
    speed: 2.2,
    value: 0,
    dropWeight: 0.08,
    duration: 14000,
    sprite: '$lib/assets/sprites/powerup-weapon.png'
  },
  SIDE_CANNONS: {
    width: 42,
    height: 42,
    speed: 2.1,
    value: 0,
    dropWeight: 0.08,
    duration: 14000,
    sprite: '$lib/assets/sprites/powerup-weapon.png'
  }
}
