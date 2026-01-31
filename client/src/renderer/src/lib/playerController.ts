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
    const weaponConfig = WEAPON_CONFIG[gameManager.player.weaponType]

    if (!this.canShoot || now - this.lastShotTime < weaponConfig.fireRate) {
      return []
    }

    this.canShoot = false
    this.lastShotTime = now

    setTimeout(() => {
      this.canShoot = true
    }, weaponConfig.fireRate)

    const bullets = this.createBullets()

    if (bullets.length > 0) {
      audioManager.playSound('shoot')
      gameManager.onBulletFired()
    }

    return bullets
  }

  private createBullets(): Bullet[] {
    const weaponType = gameManager.player.weaponType
    const weaponConfig = WEAPON_CONFIG[weaponType]

    // Handle CANNON weapon (single high-damage bullet)
    if (weaponType === 'CANNON') {
      const bullet = this.bulletPool!.acquire()
      bullet.x = this.x + this.width / 2 - bullet.width / 2
      bullet.y = this.y
      bullet.vx = 0
      bullet.vy = -bullet.speed
      bullet.active = true
      bullet.damage = weaponConfig.damage // 40 damage
      bullet.type = 'CANNON'

      audioManager.playSound('CANNON_SHOOT')
      return [bullet]
    }

    // Handle SINGLE weapon
    if (weaponType === 'SINGLE') {
      const bullet = this.bulletPool!.acquire()
      bullet.x = this.x + this.width / 2 - bullet.width / 2
      bullet.y = this.y
      bullet.vx = 0
      bullet.vy = -bullet.speed
      bullet.active = true
      bullet.damage = weaponConfig.damage
      bullet.type = 'SINGLE'

      audioManager.playSound('PLAYER_SHOOT')
      return [bullet]
    }

    // Handle DOUBLE weapon
    if (weaponType === 'DOUBLE') {
      const bullets: Bullet[] = []
      const offset = 30

      for (let i = 0; i < 2; i++) {
        const bullet = this.bulletPool!.acquire()
        bullet.x =
          this.x + (i === 0 ? this.width / 2 - offset : this.width / 2 + offset) - bullet.width / 2
        bullet.y = this.y
        bullet.vx = 0
        bullet.vy = -bullet.speed
        bullet.active = true
        bullet.damage = weaponConfig.damage
        bullet.type = 'DOUBLE'
        bullets.push(bullet)
      }

      audioManager.playSound('PLAYER_SHOOT')
      return bullets
    }

    // Handle TRIPLE weapon
    if (weaponType === 'TRIPLE') {
      const bullets: Bullet[] = []
      const offset = 35

      for (let i = 0; i < 3; i++) {
        const bullet = this.bulletPool!.acquire()
        if (i === 0) {
          bullet.x = this.x + this.width / 2 - bullet.width / 2
          bullet.vx = 0
        } else if (i === 1) {
          bullet.x = this.x + this.width / 2 - offset - bullet.width / 2
          bullet.vx = -2
        } else {
          bullet.x = this.x + this.width / 2 + offset - bullet.width / 2
          bullet.vx = 2
        }
        bullet.y = this.y
        bullet.vy = -bullet.speed
        bullet.active = true
        bullet.damage = weaponConfig.damage
        bullet.type = 'TRIPLE'
        bullets.push(bullet)
      }

      audioManager.playSound('PLAYER_SHOOT')
      return bullets
    }

    return []
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
