import type { Bullet, Enemy, BoundingBox } from '../types/gameTypes'
import { checkCollision, getBoundingBox } from '../utils/collisionSystem'

export class CombatSystem {
  checkPlayerBulletCollisions(
    playerBullets: Bullet[],
    enemies: Enemy[]
  ): Array<{ bulletId: string; enemyId: string; damage: number }> {
    const collisions: Array<{ bulletId: string; enemyId: string; damage: number }> = []

    playerBullets.forEach((bullet) => {
      if (!bullet.active || bullet.owner !== 'PLAYER') return

      const bulletBox = getBoundingBox(bullet.x, bullet.y, bullet.width, bullet.height)

      enemies.forEach((enemy) => {
        if (!enemy.active) return

        const enemyBox = getBoundingBox(enemy.x, enemy.y, enemy.width, enemy.height)

        if (checkCollision(bulletBox, enemyBox)) {
          collisions.push({
            bulletId: bullet.id,
            enemyId: enemy.id,
            damage: bullet.damage
          })
        }
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

  checkPlayerEnemyCollisions(playerBox: BoundingBox, enemies: Enemy[]): Array<{ enemyId: string }> {
    const collisions: Array<{ enemyId: string }> = []

    enemies.forEach((enemy) => {
      if (!enemy.active) return

      const enemyBox = getBoundingBox(enemy.x, enemy.y, enemy.width, enemy.height)

      if (checkCollision(playerBox, enemyBox)) {
        collisions.push({ enemyId: enemy.id })
      }
    })

    return collisions
  }
}

export const combatSystem = new CombatSystem()
