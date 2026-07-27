import type {
  BossAttackPreset,
  Enemy,
  EnemyType,
  MovementPattern,
  Bullet,
  BoundingBox
} from '$lib/types/gameTypes'
import {
  BOSS_ATTACK_PRESETS,
  ENEMY_CONFIG,
  GAME_CONFIG,
  DIFFICULTY_MODIFIERS
} from '$lib/config/gameConstants'
import { gameManager } from '$lib/game/gameManager'
import { audioManager } from '$lib/utils/AudioManager'
import { getBoundingBox } from '$lib/utils/collisionSystem'
import { poolManager } from '$lib/utils/objectPool'
import { MovementPatterns } from './movementPatterns'
import { gameEvents } from './eventBus'

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
          owner: 'ENEMY',
          vx: 0,
          vy: GAME_CONFIG.BULLET.ENEMY.SPEED
        }),
        (bullet) => {
          bullet.active = false
          bullet.x = 0
          bullet.y = 0
          bullet.vx = 0
          bullet.vy = GAME_CONFIG.BULLET.ENEMY.SPEED
        },
        GAME_CONFIG.POOL_SIZES.BULLETS,
        GAME_CONFIG.POOL_SIZES.BULLETS
      )
    }
  }

  spawnEnemy(type: EnemyType, x: number, y: number, pattern: MovementPattern): Enemy {
    const config = ENEMY_CONFIG[type]
    const modifier = DIFFICULTY_MODIFIERS[gameManager.difficulty]

    const baseSpeed = config.speed
    const adjustedSpeed =
      type === 'BOSS' ? baseSpeed * 0.7 : baseSpeed * modifier.enemySpeedMultiplier * 0.6

    const enemy: Enemy = {
      id: `enemy_${this.enemyIdCounter++}`,
      type,
      x,
      y,
      width: config.width,
      height: config.height,
      health: config.health * modifier.enemyHealthMultiplier,
      maxHealth: config.health * modifier.enemyHealthMultiplier,
      speed: adjustedSpeed,
      pattern,
      active: true,
      shootInterval: config.shootInterval,
      lastShot: Date.now(),
      scoreValue: config.scoreValue,
      patternData: this.initializePatternData(pattern, x, y)
    }

    if (pattern === 'TELEPORT') {
      MovementPatterns.initializeTeleport(enemy)
    }

    this.enemies.push(enemy)

    if (type === 'BOSS') {
      gameEvents.emit('ENEMY_SPAWNED', {
        enemy,
        isBoss: true
      })
    }

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
          amplitude: 60,
          frequency: 0.03,
          startX: x,
          startY: y
        }
      case 'CIRCLE':
        return {
          angle: 0,
          startX: x,
          startY: y,
          radius: 100
        }
      case 'CHASE':
        return {
          startX: x,
          startY: y
        }
      case 'TELEPORT':
        return {
          startX: x,
          startY: y,
          opacity: 1,
          scale: 1
        }
      case 'SPIRAL':
        return {
          angle: 0,
          radius: 150,
          startX: x,
          startY: y
        }
      default:
        return {}
    }
  }

  updateEnemies(
    deltaTime: number,
    bounds: BoundingBox,
    playerX?: number,
    playerY?: number,
    maxNewBullets = Number.POSITIVE_INFINITY
  ): Bullet[] {
    const newBullets: Bullet[] = []

    this.enemies.forEach((enemy) => {
      if (!enemy.active) return

      this.updateEnemyPosition(enemy, deltaTime, playerX, playerY, bounds)

      if (
        newBullets.length < maxNewBullets &&
        this.shouldShoot(enemy) &&
        enemy.y > 0 &&
        !this.isEnemyTeleporting(enemy)
      ) {
        newBullets.push(
          ...this.shootBullets(enemy, playerX, playerY, maxNewBullets - newBullets.length)
        )
      }
    })

    this.enemies = this.enemies.filter((enemy) => {
      if (!enemy.active) return false

      if (enemy.type !== 'BOSS' && enemy.y > bounds.height + 100) {
        gameManager.onEnemyEscaped(enemy)
        enemy.active = false
        return false
      }

      return true
    })

    return newBullets
  }

  private isEnemyTeleporting(enemy: Enemy): boolean {
    if (enemy.pattern !== 'TELEPORT') return false
    return enemy.patternData?.teleportState?.isTeleporting || false
  }

  private updateEnemyPosition(
    enemy: Enemy,
    deltaTime: number,
    playerX?: number,
    playerY?: number,
    bounds?: BoundingBox
  ): void {
    const isBoss = enemy.type === 'BOSS'
    let currentPattern = enemy.pattern

    if (isBoss && enemy.health < enemy.maxHealth * 0.4) {
      currentPattern = 'CHASE'
    }

    switch (currentPattern) {
      case 'STRAIGHT':
        MovementPatterns.updateStraight(enemy, deltaTime)
        break

      case 'WAVE':
        MovementPatterns.updateWave(enemy, deltaTime)
        break

      case 'ZIGZAG':
        MovementPatterns.updateZigzag(enemy, deltaTime)
        break

      case 'CIRCLE':
        MovementPatterns.updateCircle(enemy, deltaTime, bounds, isBoss)
        break

      case 'CHASE':
        MovementPatterns.updateChase(enemy, deltaTime, playerX, playerY)
        break

      case 'TELEPORT':
        MovementPatterns.updateTeleport(enemy, deltaTime, bounds)
        break

      case 'SPIRAL':
        MovementPatterns.updateSpiral(enemy, deltaTime)
        break

      default:
        MovementPatterns.updateStraight(enemy, deltaTime)
        break
    }

    if (bounds) {
      const margin = 10
      const maxX = bounds.width - enemy.width - margin
      const minX = margin

      if (enemy.x < minX) enemy.x = minX
      if (enemy.x > maxX) enemy.x = maxX

      if (isBoss) {
        const maxY = 250
        const minY = 50
        if (enemy.y < minY) enemy.y = minY
        if (enemy.y > maxY) enemy.y = maxY
      }
    }
  }

  private shouldShoot(enemy: Enemy): boolean {
    const now = Date.now()
    return now - enemy.lastShot >= this.getShootInterval(enemy)
  }

  private getShootInterval(enemy: Enemy): number {
    if (enemy.type !== 'BOSS') return enemy.shootInterval

    const preset = this.getBossAttackPreset(enemy)
    return Math.max(120, enemy.shootInterval * preset.intervalMultiplier)
  }

  private getBossAttackPreset(enemy: Enemy): BossAttackPreset {
    const healthPercent = Math.max(0, enemy.health / enemy.maxHealth)
    return (
      BOSS_ATTACK_PRESETS.find((preset) => healthPercent > preset.healthThreshold) ??
      BOSS_ATTACK_PRESETS[BOSS_ATTACK_PRESETS.length - 1]
    )
  }

  private shootBullets(
    enemy: Enemy,
    playerX?: number,
    playerY?: number,
    maxBullets = Number.POSITIVE_INFINITY
  ): Bullet[] {
    const bullets: Bullet[] = []

    if (enemy.type !== 'BOSS') {
      const bullet = this.createBullet(enemy, 0, 1)
      if (bullet) bullets.push(bullet)
    } else {
      const preset = this.getBossAttackPreset(enemy)
      const bulletCount = Math.min(
        preset.bulletCount,
        GAME_CONFIG.LIMITS.BOSS_BULLETS_PER_VOLLEY,
        maxBullets
      )
      const centerIndex = (bulletCount - 1) / 2
      const baseAngle = preset.aimed
        ? this.getAngleToPlayer(enemy, playerX, playerY)
        : Math.PI / 2
      const spreadStep = bulletCount > 1 ? preset.spread / (bulletCount - 1) : 0

      for (let i = 0; i < bulletCount; i++) {
        const angleOffset = ((i - centerIndex) * spreadStep * Math.PI) / 180
        const angle = baseAngle + angleOffset
        const bullet = this.createBullet(
          enemy,
          Math.cos(angle),
          Math.sin(angle),
          preset.speedMultiplier
        )
        if (bullet) bullets.push(bullet)
      }
    }

    if (bullets.length > 0) {
      enemy.lastShot = Date.now()
      audioManager.playSound('enemyShoot')
    }

    return bullets
  }

  private getAngleToPlayer(enemy: Enemy, playerX?: number, playerY?: number): number {
    if (playerX === undefined || playerY === undefined) return Math.PI / 2

    const enemyCenterX = enemy.x + enemy.width / 2
    const enemyCenterY = enemy.y + enemy.height
    const playerCenterX = playerX + GAME_CONFIG.PLAYER.WIDTH / 2
    const playerCenterY = playerY + GAME_CONFIG.PLAYER.HEIGHT / 2

    return Math.atan2(playerCenterY - enemyCenterY, playerCenterX - enemyCenterX)
  }

  private createBullet(
    enemy: Enemy,
    directionX: number,
    directionY: number,
    speedMultiplier = 1
  ): Bullet | null {
    const bullet = this.bulletPool!.acquire()
    const directionMagnitude = Math.hypot(directionX, directionY) || 1
    const speed = bullet.speed * speedMultiplier

    bullet.x = enemy.x + enemy.width / 2 - bullet.width / 2
    bullet.y = enemy.y + enemy.height
    bullet.active = true
    bullet.vx = (directionX / directionMagnitude) * speed
    bullet.vy = (directionY / directionMagnitude) * speed
    bullet.damage =
      GAME_CONFIG.BULLET.ENEMY.DAMAGE *
      DIFFICULTY_MODIFIERS[gameManager.difficulty].enemyDamageMultiplier

    return bullet
  }

  releaseBullet(bullet: Bullet): void {
    this.bulletPool?.release(bullet)
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
