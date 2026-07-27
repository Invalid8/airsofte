import { gsap } from 'gsap'
import { GAME_CONFIG } from '$lib/config/gameConstants'
import { combatSystem } from '$lib/game/combatSystem'
import { EnemyController } from '$lib/game/enemyController'
import { EnemySpawner } from '$lib/game/enemySpawner'
import { enhancedParticles } from '$lib/game/enhancedParticles'
import { gameEvents } from '$lib/game/eventBus'
import { gameManager } from '$lib/game/gameManager'
import { particleSystem } from '$lib/game/particleSystem'
import { PlayerController } from '$lib/game/playerController'
import { powerUpSystem } from '$lib/game/powerUpSystem'
import { ScreenEffects } from '$lib/game/screenEffects'
import type { Bullet, Enemy, GameEvent, PowerUp } from '$lib/types/gameTypes'
import { getBoundingBox } from '$lib/utils/collisionSystem'

export type GameRuntimeState = {
  playerBullets: Bullet[]
  enemyBullets: Bullet[]
  enemies: Enemy[]
  powerUps: PowerUp[]
  playerX: number
  playerY: number
  playerOpacity: number
  playerScale: number
  playerRotation: number
  playerOffsetY: number
  playerInvincible: boolean
}

export class GameRuntime {
  private gamePad: HTMLDivElement
  private onState: (state: GameRuntimeState) => void
  private playerController: PlayerController
  private enemyController = new EnemyController()
  private enemySpawner: EnemySpawner
  private playerBullets: Bullet[] = []
  private enemyBullets: Bullet[] = []
  private enemies: Enemy[] = []
  private powerUps: PowerUp[] = []
  private keysPressed = new Set<string>()
  private animationFrameId = 0
  private lastFrameTime = 0
  private starting = true
  private isFlashing = false
  private playerOpacity = 1
  private playerScale = 1
  private playerRotation = 0
  private playerOffsetY = 0
  private idleTween: gsap.core.Tween | null = null
  private unsubscribers: Array<() => void> = []

  private readonly movementKeys = new Set([
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'w',
    'a',
    's',
    'd'
  ])

  constructor(gamePad: HTMLDivElement, onState: (state: GameRuntimeState) => void) {
    this.gamePad = gamePad
    this.onState = onState

    const centerX = (gamePad.clientWidth - GAME_CONFIG.PLAYER.WIDTH) / 2
    const startY = gamePad.clientHeight - GAME_CONFIG.PLAYER.HEIGHT

    this.playerController = new PlayerController(centerX, startY)
    this.enemySpawner = new EnemySpawner(this.enemyController, {
      width: gamePad.clientWidth,
      height: gamePad.clientHeight
    })

    ScreenEffects.initialize(gamePad)
    this.publishState()
  }

  start(): void {
    this.bindEvents()
    this.playSpawnAnimation()

    if (gameManager.isPlaying && gameManager.currentWave && gameManager.session.currentWave > 1) {
      this.enemySpawner.startWave(gameManager.currentWave)
    }

    this.animationFrameId = requestAnimationFrame(this.tick)
  }

  stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = 0
    }

    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    this.unsubscribers.forEach((unsubscribe) => unsubscribe())
    this.unsubscribers = []

    this.idleTween?.kill()
    this.idleTween = null
    this.enemySpawner.stop()
    this.enemyBullets.forEach((bullet) => this.enemyController.releaseBullet(bullet))
    this.enemyBullets = []
    this.playerBullets.forEach((bullet) => this.playerController.releaseBullet(bullet))
    this.playerBullets = []
    powerUpSystem.clearAll()
  }

  private bindEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)

    this.unsubscribers = [
      gameEvents.on('PLAYER_HIT', this.handlePlayerHit),
      gameEvents.on('PLAYER_DEATH', this.handlePlayerDeath),
      gameEvents.on('PLAYER_RESPAWN', this.handlePlayerRespawn),
      gameEvents.on('WAVE_START', this.handleWaveStart),
      gameEvents.on('GAME_START', this.handleGameStart),
      gameEvents.on('ENEMY_DESTROYED', this.handleEnemyDestroyed)
    ]
  }

  private playSpawnAnimation(): void {
    const startY = this.gamePad.clientHeight - GAME_CONFIG.PLAYER.HEIGHT
    const targetY = startY - 80
    const spawn = { y: this.playerController.y }

    gsap.to(spawn, {
      y: targetY,
      duration: 2,
      ease: 'none',
      onUpdate: () => {
        this.playerController.y = spawn.y
        this.publishState()
      },
      onComplete: () => {
        this.starting = false
        this.startIdleTween()
      }
    })
  }

  private tick = (now: number): void => {
    const deltaMs = this.lastFrameTime ? Math.min(50, now - this.lastFrameTime) : GAME_CONFIG.FRAME_TIME
    const deltaScale = deltaMs / GAME_CONFIG.FRAME_TIME
    this.lastFrameTime = now

    if (gameManager.isPlaying && !gameManager.isPaused) {
      this.updatePlayer(deltaScale)
      this.updateEnemies(deltaMs, deltaScale)
      this.updatePowerUps(deltaMs)
      this.publishState()
    }

    this.animationFrameId = requestAnimationFrame(this.tick)
  }

  private updatePlayer(deltaScale: number): void {
    if (this.starting) return

    if (this.keysPressed.has(' ') || this.keysPressed.has('Space')) {
      const newBullets = this.playerController.shoot()
      if (newBullets.length > 0) this.playerBullets.push(...newBullets)
    }

    let inputX = 0
    let inputY = 0

    if (this.keysPressed.has('ArrowUp') || this.keysPressed.has('w')) inputY -= 1
    if (this.keysPressed.has('ArrowDown') || this.keysPressed.has('s')) inputY += 1
    if (this.keysPressed.has('ArrowLeft') || this.keysPressed.has('a')) inputX -= 1
    if (this.keysPressed.has('ArrowRight') || this.keysPressed.has('d')) inputX += 1

    if (inputX !== 0 || inputY !== 0) {
      this.stopIdleTween()
      const bounds = getBoundingBox(0, 0, this.gamePad.clientWidth, this.gamePad.clientHeight)
      this.playerController.moveBy(inputX, inputY, bounds, deltaScale)
    } else {
      this.startIdleTween()
    }

    let activeBulletCount = 0
    for (const bullet of this.playerBullets) {
      if (!bullet.active) {
        this.playerController.releaseBullet(bullet)
        continue
      }

      bullet.x += (bullet.vx || 0) * deltaScale
      bullet.y += (bullet.vy || -bullet.speed) * deltaScale

      if (bullet.y < -30) {
        bullet.active = false
        this.playerController.releaseBullet(bullet)
        continue
      }

      this.playerBullets[activeBulletCount++] = bullet
    }
    this.playerBullets.length = activeBulletCount
  }

  private updateEnemies(deltaMs: number, deltaScale: number): void {
    const bounds = getBoundingBox(0, 0, this.gamePad.clientWidth, this.gamePad.clientHeight)
    const newBullets = this.enemyController.updateEnemies(
      deltaMs,
      bounds,
      this.playerController.x,
      this.playerController.y
    )

    if (newBullets.length > 0) this.enemyBullets.push(...newBullets)

    let activeBulletCount = 0
    for (const bullet of this.enemyBullets) {
      if (!bullet.active) {
        this.enemyController.releaseBullet(bullet)
        continue
      }

      bullet.x += (bullet.vx || 0) * deltaScale
      bullet.y += (bullet.vy || bullet.speed) * deltaScale

      if (bullet.y > bounds.height + 30) {
        bullet.active = false
        this.enemyController.releaseBullet(bullet)
        continue
      }

      this.enemyBullets[activeBulletCount++] = bullet
    }
    this.enemyBullets.length = activeBulletCount

    this.enemies = this.enemyController.getActiveEnemies()
    this.checkCollisions()

    const boss = this.enemies.find((enemy) => enemy.type === 'BOSS')
    if (boss) {
      gameEvents.emit('BOSS_UPDATE', { enemy: boss })
    }
  }

  private updatePowerUps(deltaMs: number): void {
    const bounds = getBoundingBox(0, 0, this.gamePad.clientWidth, this.gamePad.clientHeight)
    powerUpSystem.updatePowerUps(bounds, deltaMs)

    const playerBox = this.playerController.getBoundingBox()
    const collected = powerUpSystem.checkPlayerCollision(playerBox)

    if (collected) {
      particleSystem.createExplosion(
        collected.x + collected.width / 2,
        collected.y + collected.height / 2,
        10,
        '#00ff88'
      )
    }

    this.powerUps = powerUpSystem.getActivePowerUps()
  }

  private checkCollisions(): void {
    const boundsHeight = this.gamePad.clientHeight
    const visibleEnemies: Enemy[] = []
    const enemyById = new Map<string, Enemy>()
    const playerBulletById = new Map<string, Bullet>()
    const enemyBulletById = new Map<string, Bullet>()

    for (const enemy of this.enemies) {
      enemyById.set(enemy.id, enemy)
      if (enemy.y >= -100 && enemy.y <= boundsHeight + 100) visibleEnemies.push(enemy)
    }
    for (const bullet of this.playerBullets) playerBulletById.set(bullet.id, bullet)
    for (const bullet of this.enemyBullets) enemyBulletById.set(bullet.id, bullet)

    for (const { bulletId, enemyId, damage } of combatSystem.checkPlayerBulletCollisions(
      this.playerBullets,
      visibleEnemies
    )) {
      const bullet = playerBulletById.get(bulletId)
      if (!bullet || !bullet.active) continue

      const enemy = enemyById.get(enemyId)
      if (!enemy || !enemy.active) continue

      particleSystem.createHitEffect(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 4)
      const killed = this.enemyController.damageEnemy(enemyId, damage)
      bullet.active = false

      if (killed) {
        if (enemy.type === 'BOSS') {
          enhancedParticles.createBossDeathExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2)
        } else {
          particleSystem.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 16, '#ff6600')
        }
        ScreenEffects.shake(enemy.type === 'BOSS' ? 12 : 4, enemy.type === 'BOSS' ? 0.4 : 0.16)
      }
    }

    const playerBox = this.playerController.getBoundingBox()

    for (const { bulletId, damage } of combatSystem.checkEnemyBulletCollisions(
      this.enemyBullets,
      playerBox
    )) {
      const bullet = enemyBulletById.get(bulletId)
      if (!bullet || !bullet.active) continue

      gameManager.damagePlayer(damage)
      bullet.active = false
      particleSystem.createHitEffect(bullet.x, bullet.y, 5)
      ScreenEffects.shake(6, 0.2)
      ScreenEffects.flash('rgba(255, 0, 0, 0.25)', 0.12)
    }

    for (const { enemyId } of combatSystem.checkPlayerEnemyCollisions(playerBox, this.enemies)) {
      const enemy = enemyById.get(enemyId)
      if (!enemy || !enemy.active) continue

      if (!gameManager.player.invincible && !gameManager.player.shieldActive) {
        gameManager.damagePlayer(30)
        particleSystem.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 14, '#ff3300')
        ScreenEffects.shake(10, 0.3)
        ScreenEffects.flash('rgba(255, 0, 0, 0.42)', 0.16)
      }

      this.enemyController.damageEnemy(enemyId, enemy.maxHealth)
    }
  }

  private publishState(): void {
    this.onState({
      playerBullets: this.playerBullets,
      enemyBullets: this.enemyBullets,
      enemies: this.enemies,
      powerUps: this.powerUps,
      playerX: this.playerController.x,
      playerY: this.playerController.y,
      playerOpacity: this.playerOpacity,
      playerScale: this.playerScale,
      playerRotation: this.playerRotation,
      playerOffsetY: this.playerOffsetY,
      playerInvincible: gameManager.player.invincible || gameManager.player.shieldActive
    })
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (this.starting || !gameManager.isPlaying || gameManager.isPaused) return

    this.keysPressed.add(event.key)

    if (this.movementKeys.has(event.key) || event.key === ' ' || event.key === 'Space') {
      event.preventDefault()
    }
  }

  private handleKeyUp = (event: KeyboardEvent): void => {
    this.keysPressed.delete(event.key)

    if (!this.hasMovementInput()) {
      this.startIdleTween()
    }
  }

  private hasMovementInput(): boolean {
    for (const key of this.movementKeys) {
      if (this.keysPressed.has(key)) return true
    }
    return false
  }

  private stopIdleTween(): void {
    if (!this.idleTween) return
    this.idleTween.kill()
    this.idleTween = null
    this.playerOffsetY = 0
  }

  private startIdleTween(): void {
    if (
      this.idleTween ||
      !this.playerController ||
      this.starting ||
      !gameManager.isPlaying ||
      gameManager.isPaused
    ) {
      return
    }

    const visual = { offsetY: this.playerOffsetY }
    this.idleTween = gsap.to(visual, {
      offsetY: 10,
      duration: 1,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
      onUpdate: () => {
        this.playerOffsetY = visual.offsetY
        this.publishState()
      }
    })
  }

  private handlePlayerHit = (): void => {
    if (this.isFlashing) return

    this.isFlashing = true
    const flashDuration = gameManager.player.invincible ? 2000 : 500
    const visual = { opacity: this.playerOpacity }

    gsap.to(visual, {
      opacity: 0.3,
      duration: 0.1,
      repeat: flashDuration / 200,
      yoyo: true,
      ease: 'none',
      onUpdate: () => {
        this.playerOpacity = visual.opacity
        this.publishState()
      },
      onComplete: () => {
        this.playerOpacity = 1
        this.isFlashing = false
        this.publishState()
      }
    })
  }

  private handlePlayerDeath = (): void => {
    const visual = {
      scale: this.playerScale,
      rotation: this.playerRotation,
      opacity: this.playerOpacity
    }

    gsap.to(visual, {
      scale: 0,
      rotation: 360,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.in',
      onUpdate: () => {
        this.playerScale = visual.scale
        this.playerRotation = visual.rotation
        this.playerOpacity = visual.opacity
        this.publishState()
      }
    })
  }

  private handlePlayerRespawn = (): void => {
    const centerX = (this.gamePad.clientWidth - this.playerController.width) / 2
    const startY = this.gamePad.clientHeight - this.playerController.height
    this.playerController.reset(centerX, startY - 80)

    const visual = { scale: 0, opacity: 0 }
    this.playerScale = 0
    this.playerOpacity = 0
    this.playerRotation = 0

    gsap.to(visual, {
      scale: 1,
      opacity: 1,
      duration: 0.5,
      ease: 'back.out',
      onUpdate: () => {
        this.playerScale = visual.scale
        this.playerOpacity = visual.opacity
        this.publishState()
      }
    })
  }

  private handleWaveStart = (): void => {
    if (!gameManager.currentWave) return
    this.enemySpawner.startWave(gameManager.currentWave)
  }

  private handleGameStart = (): void => {
    this.enemyController.clearAllEnemies()
    this.enemies = []
    this.enemyBullets.forEach((bullet) => this.enemyController.releaseBullet(bullet))
    this.enemyBullets = []
    this.publishState()
  }

  private handleEnemyDestroyed = (event: GameEvent): void => {
    const { enemy } = event.data
    if (!enemy) return

    powerUpSystem.spawnRandomPowerUp(
      enemy.x + enemy.width / 2 - 20,
      enemy.y + enemy.height / 2 - 20
    )
  }
}
