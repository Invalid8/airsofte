import type { Bullet, Enemy, BoundingBox } from '../types/gameTypes'
import { checkCollision, getBoundingBox } from '../utils/collisionSystem'
import type { PlayerController } from './playerController'
import { gameManager } from './gameManager'

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
        // FIXED: Shield blocks bullets completely - mark bullet inactive with 0 damage
        if (gameManager.player.shieldActive) {
          collisions.push({
            bulletId: bullet.id,
            damage: 0
          })
        } else {
          collisions.push({
            bulletId: bullet.id,
            damage: bullet.damage
          })
        }
      }
    })

    return collisions
  }

  checkPlayerEnemyCollisions(
    playerBox: BoundingBox,
    enemies: Enemy[],
    playerController?: PlayerController
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

        if (playerController) {
          this.applyRecoil(playerController, enemy, playerBox, enemyBox)
        }
      }
    })

    return collisions
  }

  private applyRecoil(
    player: PlayerController,
    enemy: Enemy,
    playerBox: BoundingBox,
    enemyBox: BoundingBox
  ): void {
    const playerCenterX = playerBox.x + playerBox.width / 2
    const playerCenterY = playerBox.y + playerBox.height / 2
    const enemyCenterX = enemyBox.x + enemyBox.width / 2
    const enemyCenterY = enemyBox.y + enemyBox.height / 2

    const dx = playerCenterX - enemyCenterX
    const dy = playerCenterY - enemyCenterY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance === 0) return

    const recoilForce = enemy.type === 'BOSS' ? 25 : 15
    const recoilX = (dx / distance) * recoilForce
    const recoilY = (dy / distance) * recoilForce

    player.x += recoilX
    player.y += recoilY

    const enemyRecoilFactor = enemy.type === 'BOSS' ? 0.1 : 0.3
    enemy.x -= recoilX * enemyRecoilFactor
    enemy.y -= recoilY * enemyRecoilFactor
  }
}

export const combatSystem = new CombatSystem()
