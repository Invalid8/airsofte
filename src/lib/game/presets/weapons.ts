import type { WeaponType } from '$lib/types/gameTypes'

export const WEAPON_CONFIG: Record<
  WeaponType,
  {
    bulletCount: number
    spread: number
    fireRate: number
    damage: number
  }
> = {
  SINGLE: {
    bulletCount: 1,
    spread: 0,
    fireRate: 150,
    damage: 10
  },
  DOUBLE: {
    bulletCount: 2,
    spread: 40,
    fireRate: 150,
    damage: 10
  },
  TRIPLE: {
    bulletCount: 3,
    spread: 30,
    fireRate: 200,
    damage: 8
  },
  SPREAD: {
    bulletCount: 5,
    spread: 20,
    fireRate: 300,
    damage: 6
  }
}
