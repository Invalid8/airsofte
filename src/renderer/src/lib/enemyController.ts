import type { Enemy, EnemyType, MovementPattern, Bullet, BoundingBox } from '../types/gameTypes'
import { ENEMY_CONFIG, GAME_CONFIG, DIFFICULTY_MODIFIERS } from '../config/gameConstants'
import { gameManager } from '../lib/gameManager'
import { getBoundingBox } from '../utils/collisionSystem'
import { poolManager } from '../utils/objectPool'

export class EnemyController {
  public enemies: Enemy[] = []
  private bulletPool = poolManager.getPool<Bullet>('enemyBullets')
  private enemyIdCounter = 0

  constructor() {
    this.initializeBulletPool()
  }

  private initializeBulletPool(): void {
    if (!this.bulletPool) {
      this.bulletPool = poolManager.createPool<Bullet>(
        'enemyBullets',
        () => ({
          id: `eb_${Math.random()}`,
          x: 0,
          y: 0,
          width: GAME_CONFIG.BULLET.ENEMY.WIDTH,
          height: GAME_CONFIG.BULLET.ENEMY.HEIGHT,
          speed: GAME_CONFIG.BULLET.ENEMY.SPEED,
          damage: GAME_CONFIG.BULLET.ENEMY.DAMAGE,
          active: false,
          owner: 'ENEMY'
        }),
        (bullet) => {
          bullet.active = false
          bullet.x = 0
          bullet.y = 0
        },
        GAME_CONFIG.POOL_SIZES.BULLETS,
        GAME_CONFIG.POOL_SIZES.BULLETS
      )
    }
  }

  spawnEnemy(type: EnemyType, x: number, y: number, pattern: MovementPattern): Enemy {
    const config = ENEMY_CONFIG[type]
    const modifier = DIFFICULTY_MODIFIERS[gameManager.difficulty]

    const enemy: Enemy = {
      id: `enemy_${this.enemyIdCounter++}`,
      type,
      x,
      y,
      width: config.width,
      height: config.height,
      health: config.health * modifier.enemyHealthMultiplier,
      maxHealth: config.health * modifier.enemyHealthMultiplier,
      speed: config.speed * modifier.enemySpeedMultiplier,
      pattern,
      active: true,
      shootInterval: config.shootInterval,
      lastShot: Date.now(),
      scoreValue: config.scoreValue,
      patternData: this.initializePatternData(pattern, x, y)
    }

    this.enemies.push(enemy)
    return enemy
  }

  private initializePatternData(
    pattern: MovementPattern,
    x: number,
    y: number
  ): Enemy['patternData'] {
    switch (pattern) {
      case 'WAVE':
        return {
          amplitude: 50,
          frequency: 0.02,
          startX: x,
          startY: y
        }
      case 'ZIGZAG':
        return {
          amplitude: 80,
          frequency: 0.03,
          startX: x,
          startY: y
        }
      case 'CIRCLE':
        return {
          angle: 0,
          startX: x,
          startY: y
        }
      case 'CHASE':
        return {
          startX: x,
          startY: y
        }
      default:
        return {}
    }
  }

  updateEnemies(deltaTime: number, bounds: BoundingBox, playerX?: number, playerY?: number): Bullet[] {
    const newBullets: Bullet[] = []

    this.enemies = this.enemies.filter((enemy) => {
      if (!enemy.active) return false

      this.updateEnemyPosition(enemy, deltaTime, playerX, playerY)

      if (this.shouldShoot(enemy)) {
        const bullet = this.shootBullet(enemy)
        if (bullet) newBullets.push(bullet)
      }

      if (enemy.y > bounds.height + 100) {
        enemy.active = false
        return false
      }

      return true
    })

    return newBullets
  }

  private updateEnemyPosition(enemy: Enemy, deltaTime: number, playerX?: number, playerY?: number): void {
    switch (enemy.pattern) {
      case 'STRAIGHT':
        enemy.y += enemy.speed
        break

      case 'WAVE':
        enemy.y += enemy.speed
        if (enemy.patternData) {
          const offset = Math.sin((enemy.y - enemy.patternData.startY!) * enemy.patternData.frequency!) * enemy.patternData.amplitude!
          enemy.x = enemy.patternData.startX! + offset
        }
        break

      case 'ZIGZAG':
        enemy.y += enemy.speed
        if (enemy.patternData) {
          const progress = enemy.y - enemy.patternData.startY!
          const zigzag = Math.floor(progress / 50) % 2 === 0 ? 1 : -1
          enemy.x = enemy.patternData.startX! + zigzag * enemy.patternData.amplitude!
        }
        break

      case 'CIRCLE':
        if (enemy.patternData) {
          enemy.patternData.angle = (enemy.patternData.angle || 0) + 0.02
          enemy.x = enemy.patternData.startX! + Math.cos(enemy.patternData.angle) * 100
          enemy.y = enemy.patternData.startY! + Math.sin(enemy.patternData.angle) * 100 + enemy.speed
          enemy.patternData.startY! += enemy.speed * 0.5
        }
        break

      case 'CHASE':
        if (playerX !== undefined && playerY !== undefined) {
          const dx = playerX - enemy.x
          const dy = playerY - enemy.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance > 0) {
            enemy.x += (dx / distance) * enemy.speed * 0.7
            enemy.y += (dy / distance) * enemy.speed * 0.7
          }
        } else {
          enemy.y += enemy.speed
        }
        break
    }
  }

  private shouldShoot(enemy: Enemy): boolean {
    const now = Date.now()
    return now - enemy.lastShot >= enemy.shootInterval
  }

  private shootBullet(enemy: Enemy): Bullet | null {
    const bullet = this.bulletPool!.acquire()

    bullet.x = enemy.x + enemy.width / 2 - bullet.width / 2
    bullet.y = enemy.y + enemy.height
    bullet.active = true
    bullet.damage = GAME_CONFIG.BULLET.ENEMY.DAMAGE * DIFFICULTY_MODIFIERS[gameManager.difficulty].enemyDamageMultiplier

    enemy.lastShot = Date.now()

    return bullet
  }

  damageEnemy(enemyId: string, damage: number): boolean {
    const enemy = this.enemies.find((e) => e.id === enemyId)
    if (!enemy) return false

    enemy.health -= damage

    if (enemy.health <= 0) {
      enemy.active = false
      gameManager.onEnemyDestroyed(enemy)
      return true
    }

    return false
  }

  getEnemyById(id: string): Enemy | undefined {
    return this.enemies.find((e) => e.id === id)
  }

  getActiveEnemies(): Enemy[] {
    return this.enemies.filter((e) => e.active)
  }

  clearAllEnemies(): void {
    this.enemies = []
  }

  getEnemyBoundingBox(enemy: Enemy): BoundingBox {
    return getBoundingBox(enemy.x, enemy.y, enemy.width, enemy.height)
  }
}
