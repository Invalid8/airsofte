import type { Bullet, BoundingBox } from '$lib/types/gameTypes'
import { GAME_CONFIG } from '$lib/config/gameConstants'
import { WEAPON_CONFIG } from '$lib/game/presets'
import { gameManager } from './gameManager'
import { clampToBox, getBoundingBox } from '$lib/utils/collisionSystem'
import { poolManager } from '$lib/utils/objectPool'
import { audioManager } from '$lib/utils/AudioManager'

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

  move(
    direction: 'up' | 'down' | 'left' | 'right',
    bounds: BoundingBox,
    deltaScale = 1
  ): void {
    const speed = gameManager.player.speed * deltaScale

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

  moveBy(inputX: number, inputY: number, bounds: BoundingBox, deltaScale = 1): void {
    if (inputX === 0 && inputY === 0) return

    const magnitude = Math.hypot(inputX, inputY) || 1
    const speed = gameManager.player.speed * deltaScale

    this.x += (inputX / magnitude) * speed
    this.y += (inputY / magnitude) * speed

    const clamped = clampToBox(this.x, this.y, this.width, this.height, bounds)
    this.x = clamped.x
    this.y = clamped.y
  }

  shoot(): Bullet[] {
    const now = Date.now()
    const fireRate = WEAPON_CONFIG[gameManager.player.weaponType].fireRate

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

  releaseBullet(bullet: Bullet): void {
    this.bulletPool?.release(bullet)
  }

  private createBullets(): Bullet[] {
    const weaponType = gameManager.player.weaponType
    const config = WEAPON_CONFIG[weaponType]
    const bullets: Bullet[] = []

    const centerX = this.x + this.width / 2
    const createBullet = (x: number, y: number, vx: number, vy: number): Bullet => {
      const bullet = this.bulletPool!.acquire()
      bullet.x = x - bullet.width / 2
      bullet.y = y
      bullet.vx = vx
      bullet.vy = vy
      bullet.active = true
      bullet.damage = config.damage
      return bullet
    }

    if (config.layout === 'NOSE') {
      bullets.push(createBullet(centerX, this.y - 8, 0, -GAME_CONFIG.BULLET.PLAYER.SPEED * 1.18))
      return bullets
    }

    if (config.layout === 'SIDE') {
      const sideY = this.y + this.height * 0.42
      bullets.push(
        createBullet(this.x + this.width * 0.18, sideY, -GAME_CONFIG.BULLET.PLAYER.SPEED * 0.28, -GAME_CONFIG.BULLET.PLAYER.SPEED * 0.96),
        createBullet(this.x + this.width * 0.82, sideY, GAME_CONFIG.BULLET.PLAYER.SPEED * 0.28, -GAME_CONFIG.BULLET.PLAYER.SPEED * 0.96)
      )
      return bullets
    }

    if (config.bulletCount === 1) {
      bullets.push(createBullet(centerX, this.y, 0, -GAME_CONFIG.BULLET.PLAYER.SPEED))
    } else if (config.bulletCount === 2) {
      const offset = config.spread / 2
      bullets.push(
        createBullet(centerX - offset, this.y, 0, -GAME_CONFIG.BULLET.PLAYER.SPEED),
        createBullet(centerX + offset, this.y, 0, -GAME_CONFIG.BULLET.PLAYER.SPEED)
      )
    } else {
      const angleStep = config.spread / (config.bulletCount - 1)
      const startAngle = -config.spread / 2

      for (let i = 0; i < config.bulletCount; i++) {
        const angle = startAngle + angleStep * i
        const angleRad = (angle * Math.PI) / 180
        bullets.push(
          createBullet(
            centerX,
            this.y,
            Math.sin(angleRad) * GAME_CONFIG.BULLET.PLAYER.SPEED,
            -Math.cos(angleRad) * GAME_CONFIG.BULLET.PLAYER.SPEED
          )
        )
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
