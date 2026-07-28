import type { EnemyType } from '$lib/types/gameTypes'

export const ENEMY_CONFIG: Record<
  EnemyType,
  {
    width: number
    height: number
    health: number
    speed: number
    scoreValue: number
    shootInterval: number
    speedScale: number
    sprite: string
  }
> = {
  BASIC: {
    width: 80,
    height: 80,
    health: 30,
    speed: 2,
    scoreValue: 100,
    shootInterval: 2000,
    speedScale: 0.62,
    sprite: '$lib/assets/sprites/enemy-basic.png'
  },
  SCOUT: {
    width: 60,
    height: 60,
    health: 15,
    speed: 4,
    scoreValue: 150,
    shootInterval: 1500,
    speedScale: 0.58,
    sprite: '$lib/assets/sprites/enemy-scout.png'
  },
  BOMBER: {
    width: 120,
    height: 120,
    health: 80,
    speed: 1,
    scoreValue: 300,
    shootInterval: 3000,
    speedScale: 0.64,
    sprite: '$lib/assets/sprites/enemy-bomber.png'
  },
  BOSS: {
    width: 250,
    height: 250,
    health: 3000,
    speed: 1.5,
    scoreValue: 5000,
    shootInterval: 800,
    speedScale: 0.7,
    sprite: '$lib/assets/sprites/boss-1.png'
  }
}
