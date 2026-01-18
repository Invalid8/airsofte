import type { Bullet, BoundingBox } from '../types/gameTypes'
import { GAME_CONFIG, WEAPON_CONFIG } from '../config/gameConstants'
import { gameManager } from '../lib/gameManager'
import { ShootSound1 } from '../lib/sounds'
import { clampToBox, getBoundingBox } from '../utils/collisionSystem'
import { poolManager } from '../utils/objectPool'

export class PlayerController {
  public x: number = 0
  public y: number = 0
  public width: number = GAME_CONFIG.PLAYER.WIDTH
  public height: number = GAME_CONFIG.PLAYER.HEIGHT

  private canShoot: boolean = true
  private lastShotTime: number = 0
  private shootSound = ShootSound1()
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
          owner: 'PLAYER'
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
      this.shootSound.play()
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
      bullet.active = true
      bullet.damage = config.damage
      bullets.push(bullet)
    } else {
      const angleStep = config.spread / (config.bulletCount - 1)
      const startAngle = -config.spread / 2

      for (let i = 0; i < config.bulletCount; i++) {
        const bullet = this.bulletPool!.acquire()
        const angle = startAngle + angleStep * i
        const offset = Math.tan((angle * Math.PI) / 180) * 50

        bullet.x = centerX + offset - bullet.width / 2
        bullet.y = this.y
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
