import type { Bullet, Enemy, BoundingBox } from '$lib/types/gameTypes'

export type PlayerBulletCollision = {
  bullet: Bullet
  enemy: Enemy
  damage: number
}

export type EnemyBulletCollision = {
  bullet: Bullet
  damage: number
}

export type PlayerEnemyCollision = {
  enemy: Enemy
  isBoss: boolean
}

export class CombatSystem {
  private playerBulletCollisions: PlayerBulletCollision[] = []
  private enemyBulletCollisions: EnemyBulletCollision[] = []
  private playerEnemyCollisions: PlayerEnemyCollision[] = []

  checkPlayerBulletCollisions(
    playerBullets: Bullet[],
    enemies: Enemy[]
  ): PlayerBulletCollision[] {
    const collisions = this.playerBulletCollisions
    collisions.length = 0

    if (enemies.length === 0 || playerBullets.length === 0) {
      return collisions
    }

    for (const bullet of playerBullets) {
      if (!bullet.active || bullet.owner !== 'PLAYER') continue

      for (const enemy of enemies) {
        if (!enemy.active) continue

        if (!this.overlaps(bullet, enemy)) continue
        collisions.push({
          bullet,
          enemy,
          damage: bullet.damage
        })
      }
    }

    return collisions
  }

  checkEnemyBulletCollisions(
    enemyBullets: Bullet[],
    playerBox: BoundingBox
  ): EnemyBulletCollision[] {
    const collisions = this.enemyBulletCollisions
    collisions.length = 0

    for (const bullet of enemyBullets) {
      if (!bullet.active || bullet.owner !== 'ENEMY') continue

      if (this.overlapsBox(bullet, playerBox)) {
        collisions.push({
          bullet,
          damage: bullet.damage
        })
      }
    }

    return collisions
  }

  checkPlayerEnemyCollisions(
    playerBox: BoundingBox,
    enemies: Enemy[]
  ): PlayerEnemyCollision[] {
    const collisions = this.playerEnemyCollisions
    collisions.length = 0

    for (const enemy of enemies) {
      if (!enemy.active) continue

      if (this.overlapsBox(enemy, playerBox)) {
        collisions.push({
          enemy,
          isBoss: enemy.type === 'BOSS'
        })
      }
    }

    return collisions
  }

  private overlaps(
    source: { x: number; y: number; width: number; height: number },
    target: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      source.x < target.x + target.width &&
      source.x + source.width > target.x &&
      source.y < target.y + target.height &&
      source.y + source.height > target.y
    )
  }

  private overlapsBox(
    source: { x: number; y: number; width: number; height: number },
    target: BoundingBox
  ): boolean {
    return (
      source.x < target.x + target.width &&
      source.x + source.width > target.x &&
      source.y < target.y + target.height &&
      source.y + source.height > target.y
    )
  }
}

export const combatSystem = new CombatSystem()
