import type { WeaponType } from '$lib/types/gameTypes'

export const WEAPON_CONFIG: Record<
  WeaponType,
  {
    bulletCount: number
    spread: number
    fireRate: number
    damage: number
    layout?: 'CENTER' | 'PAIR' | 'FAN' | 'NOSE' | 'SIDE'
  }
> = {
  SINGLE: {
    bulletCount: 1,
    spread: 0,
    fireRate: 150,
    damage: 10,
    layout: 'CENTER'
  },
  DOUBLE: {
    bulletCount: 2,
    spread: 40,
    fireRate: 150,
    damage: 10,
    layout: 'PAIR'
  },
  TRIPLE: {
    bulletCount: 3,
    spread: 30,
    fireRate: 200,
    damage: 8,
    layout: 'FAN'
  },
  SPREAD: {
    bulletCount: 5,
    spread: 20,
    fireRate: 300,
    damage: 6,
    layout: 'FAN'
  },
  NOSE_CANNON: {
    bulletCount: 1,
    spread: 0,
    fireRate: 115,
    damage: 18,
    layout: 'NOSE'
  },
  SIDE_CANNONS: {
    bulletCount: 2,
    spread: 84,
    fireRate: 170,
    damage: 12,
    layout: 'SIDE'
  }
}
