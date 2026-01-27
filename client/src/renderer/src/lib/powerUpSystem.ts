import type { PowerUp, PowerUpType, BoundingBox } from '../types/gameTypes'
import { POWERUP_CONFIG, DIFFICULTY_MODIFIERS } from '../config/gameConstants'
import { gameManager } from './gameManager'
import { gameEvents } from './eventBus'
import { getBoundingBox } from '../utils/collisionSystem'
import { poolManager } from '../utils/objectPool'

export class PowerUpSystem {
  public powerUps: PowerUp[] = []
  private powerUpIdCounter = 0
  private powerUpPool = poolManager.getPool<PowerUp>('powerUps')

  constructor() {
    this.initializePool()
  }

  private initializePool(): void {
    if (!this.powerUpPool) {
      this.powerUpPool = poolManager.createPool<PowerUp>(
        'powerUps',
        () => ({
          id: `pu_${Math.random()}`,
          type: 'HEALTH',
          x: 0,
          y: 0,
          width: 40,
          height: 40,
          speed: 2,
          active: false,
          value: 0
        }),
        (powerUp) => {
          powerUp.active = false
          powerUp.x = 0
          powerUp.y = 0
        },
        20,
        20
      )
    }
  }

  spawnPowerUp(type: PowerUpType, x: number, y: number): PowerUp {
    const config = POWERUP_CONFIG[type]
    const powerUp = this.powerUpPool!.acquire()

    powerUp.id = `powerup_${this.powerUpIdCounter++}`
    powerUp.type = type
    powerUp.x = x
    powerUp.y = y
    powerUp.width = config.width
    powerUp.height = config.height
    powerUp.speed = config.speed
    powerUp.value = config.value
    powerUp.active = true

    this.powerUps.push(powerUp)
    gameEvents.emit('POWERUP_SPAWNED', { type, x, y })

    return powerUp
  }

  spawnRandomPowerUp(x: number, y: number): PowerUp | null {
    const spawnRate = DIFFICULTY_MODIFIERS[gameManager.difficulty].powerUpSpawnRate

    if (Math.random() > spawnRate) return null

    const types: PowerUpType[] = ['HEALTH', 'WEAPON', 'SHIELD', 'SPEED', 'SCORE']
    const weights = [0.15, 0.3, 0.2, 0.2, 0.15]

    let random = Math.random()
    let selectedType: PowerUpType = 'SCORE'

    for (let i = 0; i < types.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        selectedType = types[i]
        break
      }
    }

    return this.spawnPowerUp(selectedType, x, y)
  }

  updatePowerUps(bounds: BoundingBox): void {
    this.powerUps = this.powerUps.filter((powerUp) => {
      if (!powerUp.active) return false

      powerUp.y += powerUp.speed

      if (powerUp.y > bounds.height + 50) {
        powerUp.active = false
        this.powerUpPool!.release(powerUp)
        return false
      }

      return true
    })
  }

  checkPlayerCollision(playerBox: BoundingBox): PowerUp | null {
    for (const powerUp of this.powerUps) {
      if (!powerUp.active) continue

      const powerUpBox = getBoundingBox(powerUp.x, powerUp.y, powerUp.width, powerUp.height)

      if (this.checkBoxCollision(playerBox, powerUpBox)) {
        this.collectPowerUp(powerUp)
        return powerUp
      }
    }

    return null
  }

  private checkBoxCollision(box1: BoundingBox, box2: BoundingBox): boolean {
    return (
      box1.x < box2.x + box2.width &&
      box1.x + box1.width > box2.x &&
      box1.y < box2.y + box2.height &&
      box1.y + box1.height > box2.y
    )
  }

  private collectPowerUp(powerUp: PowerUp): void {
    powerUp.active = false

    switch (powerUp.type) {
      case 'HEALTH':
        gameManager.healPlayer(powerUp.value)
        break

      case 'WEAPON': {
        const weaponTypes = ['DOUBLE', 'TRIPLE', 'SPREAD'] as const
        const randomWeapon = weaponTypes[Math.floor(Math.random() * weaponTypes.length)]
        gameManager.changeWeapon(randomWeapon, POWERUP_CONFIG.WEAPON.duration)
        break
      }

      case 'SHIELD':
        gameManager.activateShield(POWERUP_CONFIG.SHIELD.duration!)
        break

      case 'SPEED':
        gameManager.player.speed = gameManager.player.speed * powerUp.value
        setTimeout(() => {
          gameManager.player.speed = gameManager.player.speed / powerUp.value
          gameEvents.emit('SPEED_BOOST_EXPIRED')
        }, POWERUP_CONFIG.SPEED.duration)
        break

      case 'SCORE':
        gameManager.addScore(powerUp.value)
        break
    }

    gameEvents.emit('POWERUP_COLLECTED', { type: powerUp.type, value: powerUp.value })
  }

  getActivePowerUps(): PowerUp[] {
    return this.powerUps.filter((p) => p.active)
  }

  clearAll(): void {
    this.powerUps.forEach((p) => {
      p.active = false
      this.powerUpPool!.release(p)
    })
    this.powerUps = []
  }
}

export const powerUpSystem = new PowerUpSystem()
