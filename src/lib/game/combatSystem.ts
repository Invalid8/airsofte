import type { Bullet, Enemy, BoundingBox } from '$lib/types/gameTypes'
import { checkCollision, getBoundingBox, SpatialGrid } from '$lib/utils/collisionSystem'

export class CombatSystem {
  checkPlayerBulletCollisions(
    playerBullets: Bullet[],
    enemies: Enemy[]
  ): Array<{ bulletId: string; enemyId: string; damage: number }> {
    const collisions: Array<{ bulletId: string; enemyId: string; damage: number }> = []
    const activeEnemies = enemies.filter((enemy) => enemy.active)

    if (activeEnemies.length === 0) {
      return collisions
    }

    let maxX = 1
    let maxY = 1
    const enemyById = new Map<string, Enemy>()

    activeEnemies.forEach((enemy) => {
      maxX = Math.max(maxX, enemy.x + enemy.width)
      maxY = Math.max(maxY, enemy.y + enemy.height)
      enemyById.set(enemy.id, enemy)
    })

    const grid = new SpatialGrid(maxX, maxY, 160)

    activeEnemies.forEach((enemy) => {
      grid.insert(enemy.id, getBoundingBox(enemy.x, enemy.y, enemy.width, enemy.height), 'ENEMY')
    })

    playerBullets.forEach((bullet) => {
      if (!bullet.active || bullet.owner !== 'PLAYER') return

      const bulletBox = getBoundingBox(bullet.x, bullet.y, bullet.width, bullet.height)
      const nearbyEnemies = grid.queryCollisions(bulletBox)

      nearbyEnemies.forEach(({ id }) => {
        const enemy = enemyById.get(id)
        if (!enemy) return

        collisions.push({
          bulletId: bullet.id,
          enemyId: enemy.id,
          damage: bullet.damage
        })
      })
    })

    return collisions
  }

  checkEnemyBulletCollisions(
    enemyBullets: Bullet[],
    playerBox: BoundingBox
  ): Array<{ bulletId: string; damage: number }> {
    const collisions: Array<{ bulletId: string; damage: number }> = []

    enemyBullets.forEach((bullet) => {
      if (!bullet.active || bullet.owner !== 'ENEMY') return

      const bulletBox = getBoundingBox(bullet.x, bullet.y, bullet.width, bullet.height)

      if (checkCollision(bulletBox, playerBox)) {
        collisions.push({
          bulletId: bullet.id,
          damage: bullet.damage
        })
      }
    })

    return collisions
  }

  checkPlayerEnemyCollisions(
    playerBox: BoundingBox,
    enemies: Enemy[]
  ): Array<{ enemyId: string; isBoss: boolean }> {
    const collisions: Array<{ enemyId: string; isBoss: boolean }> = []

    enemies.forEach((enemy) => {
      if (!enemy.active) return

      const enemyBox = getBoundingBox(enemy.x, enemy.y, enemy.width, enemy.height)

      if (checkCollision(playerBox, enemyBox)) {
        collisions.push({
          enemyId: enemy.id,
          isBoss: enemy.type === 'BOSS'
        })
      }
    })

    return collisions
  }
}

export const combatSystem = new CombatSystem()
