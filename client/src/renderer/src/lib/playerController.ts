import type { Bullet, BoundingBox } from '../types/gameTypes'
import { GAME_CONFIG, WEAPON_CONFIG } from '../config/gameConstants'
import { gameManager } from './gameManager'
import { clampToBox, getBoundingBox } from '../utils/collisionSystem'
import { poolManager } from '../utils/objectPool'
import { audioManager } from '../utils/AudioManager'

export class PlayerController {
  public x: number = 0
  public y: number = 0
  public width: number = GAME_CONFIG.PLAYER.WIDTH
  public height: number = GAME_CONFIG.PLAYER.HEIGHT

  private canShoot: boolean = true
  private lastShotTime: number = 0
  private bulletPool = poolManager.getPool<Bullet>('playerBullets')

  constructor(startX: number, startY: number) {
    this.x = startX
    this.y = startY
    this.initializeBulletPool()
  }

  private initializeBulletPool(): void {
    if (!this.bulletPool) {
      this.bulletPool = poolManager.createPool<Bullet>(
        'playerBullets',
        () => ({
          id: `pb_${Math.random()}`,
          x: 0,
          y: 0,
          width: GAME_CONFIG.BULLET.PLAYER.WIDTH,
          height: GAME_CONFIG.BULLET.PLAYER.HEIGHT,
          speed: GAME_CONFIG.BULLET.PLAYER.SPEED,
          damage: GAME_CONFIG.BULLET.PLAYER.DAMAGE,
          active: false,
          owner: 'PLAYER',
          vx: 0,
          vy: -GAME_CONFIG.BULLET.PLAYER.SPEED
        }),
        (bullet) => {
          bullet.active = false
          bullet.x = 0
          bullet.y = 0
          bullet.vx = 0
          bullet.vy = -GAME_CONFIG.BULLET.PLAYER.SPEED
        },
        GAME_CONFIG.POOL_SIZES.BULLETS,
        GAME_CONFIG.POOL_SIZES.BULLETS
      )
    }
  }

  move(direction: 'up' | 'down' | 'left' | 'right', bounds: BoundingBox): void {
    const speed = gameManager.player.speed

    switch (direction) {
      case 'up':
        this.y -= speed
        break
      case 'down':
        this.y += speed
        break
      case 'left':
        this.x -= speed
        break
      case 'right':
        this.x += speed
        break
    }

    const clamped = clampToBox(this.x, this.y, this.width, this.height, bounds)
    this.x = clamped.x
    this.y = clamped.y
  }

  shoot(): Bullet[] {
    const now = Date.now()
    const fireRate = gameManager.player.fireRate

    if (!this.canShoot || now - this.lastShotTime < fireRate) {
      return []
    }

    this.canShoot = false
    this.lastShotTime = now

    setTimeout(() => {
      this.canShoot = true
    }, fireRate)

    const bullets = this.createBullets()

    if (bullets.length > 0) {
      audioManager.playSound('shoot')
      gameManager.onBulletFired()
    }

    return bullets
  }

  private createBullets(): Bullet[] {
    const weaponType = gameManager.player.weaponType
    const config = WEAPON_CONFIG[weaponType]
    const bullets: Bullet[] = []

    const centerX = this.x + this.width / 2

    if (config.bulletCount === 1) {
      const bullet = this.bulletPool!.acquire()
      bullet.x = centerX - bullet.width / 2
      bullet.y = this.y
      bullet.vx = 0
      bullet.vy = -bullet.speed
      bullet.active = true
      bullet.damage = config.damage
      bullets.push(bullet)
    } else if (config.bulletCount === 2) {
      const offset = config.spread / 2

      const leftBullet = this.bulletPool!.acquire()
      leftBullet.x = centerX - offset - leftBullet.width / 2
      leftBullet.y = this.y
      leftBullet.vx = 0
      leftBullet.vy = -leftBullet.speed
      leftBullet.active = true
      leftBullet.damage = config.damage
      bullets.push(leftBullet)

      const rightBullet = this.bulletPool!.acquire()
      rightBullet.x = centerX + offset - rightBullet.width / 2
      rightBullet.y = this.y
      rightBullet.vx = 0
      rightBullet.vy = -rightBullet.speed
      rightBullet.active = true
      rightBullet.damage = config.damage
      bullets.push(rightBullet)
    } else {
      const angleStep = config.spread / (config.bulletCount - 1)
      const startAngle = -config.spread / 2

      for (let i = 0; i < config.bulletCount; i++) {
        const bullet = this.bulletPool!.acquire()
        const angle = startAngle + angleStep * i
        const angleRad = (angle * Math.PI) / 180

        bullet.x = centerX - bullet.width / 2
        bullet.y = this.y
        bullet.vx = Math.sin(angleRad) * bullet.speed
        bullet.vy = -Math.cos(angleRad) * bullet.speed
        bullet.active = true
        bullet.damage = config.damage
        bullets.push(bullet)
      }
    }

    return bullets
  }

  getBoundingBox(): BoundingBox {
    return getBoundingBox(this.x, this.y, this.width, this.height)
  }

  setPosition(x: number, y: number): void {
    this.x = x
    this.y = y
  }

  takeDamage(damage: number): void {
    gameManager.damagePlayer(damage)
  }

  isInvincible(): boolean {
    return gameManager.player.invincible || gameManager.player.shieldActive
  }

  reset(startX: number, startY: number): void {
    this.x = startX
    this.y = startY
    this.canShoot = true
    this.lastShotTime = 0
  }
}
