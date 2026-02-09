import type { GameSessionState, PlayerStats, Wave, GameDifficulty, Enemy } from '../types/gameTypes'
import {
  GAME_CONFIG,
  DIFFICULTY_MODIFIERS,
  SCORE_VALUES,
  WAVE_TEMPLATES
} from '../config/gameConstants'
import { StorageManager } from '../utils/storageManager'
import { gameEvents } from './eventBus'
import { storyMissionManager } from './storyMissionData'
import { aiMissionStore } from '../stores/aiMissionStore'

type GameMode = 'QUICK_PLAY' | 'STORY_MODE' | 'AI_MISSION'

type PowerUpTimer = {
  type: 'shield' | 'weapon' | 'speed'
  endTime: number
  timeoutId: number | null
  remainingTime: number
}

export class GameManager {
  private static instance: GameManager

  public mode: GameMode = 'QUICK_PLAY'
  public difficulty: GameDifficulty = 'Normal'
  public isPlaying: boolean = false
  public isPaused: boolean = false

  public session: GameSessionState = {
    playing: false,
    score: 0,
    currentWave: 0,
    enemiesDefeated: 0,
    bulletsShot: 0,
    accuracy: 0,
    timeElapsed: 0,
    comboMultiplier: 1,
    comboTimer: 0
  }

  public player: PlayerStats = {
    health: GAME_CONFIG.PLAYER.MAX_HEALTH,
    maxHealth: GAME_CONFIG.PLAYER.MAX_HEALTH,
    lives: GAME_CONFIG.PLAYER.MAX_LIVES,
    speed: GAME_CONFIG.PLAYER.SPEED,
    fireRate: GAME_CONFIG.PLAYER.FIRE_RATE,
    weaponType: 'SINGLE',
    shieldActive: false,
    invincible: false,
    invincibleUntil: 0,
    shieldDuration: 0,
    shieldStartTime: 0,
    weaponUpgradeDuration: 0,
    weaponUpgradeStartTime: 0,
    speedBoostActive: false,
    speedBoostDuration: 0,
    speedBoostStartTime: 0
  }

  public currentWave: Wave | null = null
  public waves: Wave[] = []
  private enemiesSpawned = 0
  private enemiesDestroyedInWave = 0
  private currentWaveIndex: number = 0

  private gameLoopId: number | null = null
  private lastFrameTime: number = 0
  private startTime: number = 0
  private comboTimeoutId: number | null = null
  private waveCompleting = false
  private continuousSpawnMode: boolean = false
  private continuousSpawnInterval: number | null = null

  private pauseStartTime: number = 0
  private totalPausedTime: number = 0

  private activePowerUpTimers: Map<string, PowerUpTimer> = new Map()
  private basePlayerSpeed: number = GAME_CONFIG.PLAYER.SPEED
  private weaponQueue: Array<{ type: PlayerStats['weaponType']; remainingTime: number }> = []

  private constructor() {
    this.loadSettings()
  }

  static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager()
    }
    return GameManager.instance
  }

  private loadSettings(): void {
    const settings = StorageManager.getSettings()
    this.difficulty = settings.difficulty

    gameEvents.on('DISABLE_CONTINUOUS_SPAWN', () => {
      this.disableContinuousSpawn()
    })

    gameEvents.on('ENEMY_ESCAPED', () => {
      this.onEnemyEscaped()
    })
  }

  private initializeWaveEnemyCount(): void {
    if (!this.currentWave) {
      this.enemiesSpawned = 0
      return
    }

    this.enemiesSpawned = this.currentWave.enemies.reduce(
      (total, enemyGroup) => total + enemyGroup.count,
      0
    )
    this.enemiesDestroyedInWave = 0
  }

  startGame(mode: GameMode, difficulty?: GameDifficulty, missionId?: number): void {
    this.mode = mode
    if (difficulty) this.difficulty = difficulty

    this.resetSession()
    this.resetPlayer()

    if (mode === 'STORY_MODE' || mode === 'AI_MISSION') {
      if (!missionId) {
        throw new Error('Mission ID required for story/AI missions')
      }

      if (mode === 'AI_MISSION') {
        const mission = aiMissionStore.getMission()
        if (mission) {
          if (mission?.objectives.some((obj) => obj.type === 'SURVIVE')) {
            this.enableContinuousSpawn()
          }
        }
      } else {
        this.initializeStoryMission(missionId)

        const mission = storyMissionManager.getMissionById(missionId)
        if (mission?.objectives.some((obj) => obj.type === 'SURVIVE')) {
          this.enableContinuousSpawn()
        }
      }
    } else {
      this.initializeWaves()
    }

    this.isPlaying = true
    this.isPaused = false
    this.session.playing = true
    this.startTime = performance.now()
    this.lastFrameTime = this.startTime
    this.totalPausedTime = 0

    this.initializeWaveEnemyCount()

    this.startGameLoop()

    gameEvents.emit('GAME_START', { mode, difficulty: this.difficulty, missionId })

    setTimeout(() => {
      gameEvents.emit('WAVE_START', {
        wave: this.session.currentWave,
        hasBoss: this.currentWave?.enemies.some((e) => e.type === 'BOSS')
      })
    }, 1500)
  }

  enableContinuousSpawn(): void {
    if (this.continuousSpawnMode) return

    this.continuousSpawnMode = true

    this.continuousSpawnInterval = window.setInterval(() => {
      if (!this.isPlaying || this.isPaused) return

      const count = Math.floor(Math.random() * 3) + 2

      gameEvents.emit('SPAWN_CONTINUOUS_ENEMIES', {
        count,
        types: ['BASIC', 'SCOUT']
      })
    }, 5000)
  }

  disableContinuousSpawn(): void {
    this.continuousSpawnMode = false
    if (this.continuousSpawnInterval) {
      clearInterval(this.continuousSpawnInterval)
      this.continuousSpawnInterval = null
    }
  }

  private startGameLoop(): void {
    const loop = (timestamp: number): void => {
      if (!this.isPlaying) return

      const deltaTime = timestamp - this.lastFrameTime
      this.lastFrameTime = timestamp

      if (!this.isPaused) {
        this.updateTime(deltaTime)
      }

      this.gameLoopId = requestAnimationFrame(loop)
    }

    this.gameLoopId = requestAnimationFrame(loop)
  }

  private resetSession(): void {
    this.session = {
      playing: true,
      score: 0,
      currentWave: 0,
      enemiesDefeated: 0,
      bulletsShot: 0,
      accuracy: 0,
      timeElapsed: 0,
      comboMultiplier: 1,
      comboTimer: 0
    }
    this.enemiesSpawned = 0
    this.enemiesDestroyedInWave = 0
    this.waveCompleting = false
    this.activePowerUpTimers.clear()
    this.totalPausedTime = 0
  }

  private resetPlayer(): void {
    this.player = {
      health: GAME_CONFIG.PLAYER.MAX_HEALTH,
      maxHealth: GAME_CONFIG.PLAYER.MAX_HEALTH,
      lives: GAME_CONFIG.PLAYER.MAX_LIVES,
      speed: GAME_CONFIG.PLAYER.SPEED,
      fireRate: GAME_CONFIG.PLAYER.FIRE_RATE,
      weaponType: 'SINGLE',
      shieldActive: false,
      invincible: false,
      invincibleUntil: 0,
      shieldDuration: 0,
      shieldStartTime: 0,
      weaponUpgradeDuration: 0,
      weaponUpgradeStartTime: 0,
      speedBoostActive: false,
      speedBoostDuration: 0,
      speedBoostStartTime: 0
    }
    this.basePlayerSpeed = GAME_CONFIG.PLAYER.SPEED
  }

  pauseGame(): void {
    if (!this.isPlaying || this.isPaused) return
    this.isPaused = true
    this.session.playing = false

    this.pauseStartTime = Date.now()

    this.activePowerUpTimers.forEach((timer) => {
      if (timer.timeoutId) {
        clearTimeout(timer.timeoutId)
        timer.timeoutId = null
      }
      timer.remainingTime = timer.endTime - Date.now()
    })

    gameEvents.emit('GAME_PAUSED')
  }

  resumeGame(): void {
    if (!this.isPlaying || !this.isPaused) return

    const pauseDuration = Date.now() - this.pauseStartTime
    this.totalPausedTime += pauseDuration

    this.isPaused = false
    this.session.playing = true
    this.lastFrameTime = performance.now()
    this.startTime += pauseDuration

    this.activePowerUpTimers.forEach((timer, key) => {
      timer.endTime = Date.now() + timer.remainingTime

      if (timer.type === 'shield') {
        this.player.shieldStartTime = Date.now()
        this.player.shieldDuration = timer.remainingTime
      } else if (timer.type === 'weapon') {
        this.player.weaponUpgradeStartTime = Date.now()
        this.player.weaponUpgradeDuration = timer.remainingTime
      } else if (timer.type === 'speed') {
        this.player.speedBoostStartTime = Date.now()
        this.player.speedBoostDuration = timer.remainingTime
      }

      timer.timeoutId = window.setTimeout(() => {
        this.handlePowerUpExpiry(timer.type)
        this.activePowerUpTimers.delete(key)
      }, timer.remainingTime)
    })

    gameEvents.emit('GAME_RESUMED')
  }

  private handlePowerUpExpiry(type: 'shield' | 'weapon' | 'speed'): void {
    switch (type) {
      case 'shield':
        this.deactivateShield()
        break
      case 'weapon':
        this.player.weaponType = 'SINGLE'
        this.player.weaponUpgradeDuration = 0
        this.player.weaponUpgradeStartTime = 0
        gameEvents.emit('WEAPON_EXPIRED', { weapon: this.player.weaponType })
        break
      case 'speed':
        this.player.speedBoostActive = false
        this.player.speedBoostDuration = 0
        this.player.speedBoostStartTime = 0
        this.player.speed = this.basePlayerSpeed
        gameEvents.emit('SPEED_BOOST_DEACTIVATED')
        break
    }
  }

  getTotalPausedTime(): number {
    return this.totalPausedTime
  }

  endGame(victory: boolean = false): void {
    this.isPlaying = false
    this.isPaused = false
    this.session.playing = false

    this.disableContinuousSpawn()

    this.activePowerUpTimers.forEach((timer) => {
      if (timer.timeoutId) {
        clearTimeout(timer.timeoutId)
      }
    })
    this.activePowerUpTimers.clear()

    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId)
      this.gameLoopId = null
    }

    const finalScore = this.session.score
    const finalWave = this.session.currentWave

    setTimeout(() => {
      gameEvents.emit('GAME_OVER', {
        victory: victory && this.mode === 'STORY_MODE',
        score: finalScore,
        wave: finalWave,
        stats: { ...this.session }
      })
    }, 500)
  }

  private updateTime(deltaTime: number): void {
    this.session.timeElapsed += deltaTime
  }

  private initializeStoryMission(missionId: number): void {
    const mission = storyMissionManager.getMissionById(missionId)
    if (!mission) return

    this.waves = mission?.waves?.map((wave) => ({
      ...wave,
      completed: false
    }))

    this.currentWaveIndex = 0
    this.currentWave = this.waves[0]
    this.session.currentWave = this.currentWaveIndex + 1
  }

  private initializeWaves(): void {
    const modifier = DIFFICULTY_MODIFIERS[this.difficulty]

    this.waves = WAVE_TEMPLATES.map((template) => ({
      id: template.id,
      spawnInterval: template.spawnInterval,
      completed: false,
      enemies: template.enemies.map((e) => ({
        type: e.type,
        pattern: e.pattern,
        spawnDelay: e.spawnDelay,
        count: Math.ceil(e.count * modifier.enemyCountMultiplier)
      }))
    }))

    this.currentWaveIndex = 0
    this.currentWave = this.waves[0]
    this.session.currentWave = 1
  }

  addScore(points: number): void {
    const multiplier = DIFFICULTY_MODIFIERS[this.difficulty].scoreMultiplier
    const comboPoints = points * this.session.comboMultiplier * multiplier
    this.session.score += Math.floor(comboPoints)
    gameEvents.emit('SCORE_UPDATED', { score: this.session.score })
  }

  onEnemyDestroyed(enemy: Enemy): void {
    this.session.enemiesDefeated++
    this.enemiesDestroyedInWave++
    this.addScore(enemy.scoreValue)
    this.incrementCombo()

    gameEvents.emit('ENEMY_DESTROYED', { enemy })

    if (this.enemiesDestroyedInWave >= this.enemiesSpawned && !this.waveCompleting) {
      this.completeWave()
    }
  }

  onEnemyEscaped(): void {
    this.enemiesDestroyedInWave++

    if (this.enemiesDestroyedInWave >= this.enemiesSpawned && !this.waveCompleting) {
      this.completeWave()
    }
  }

  onBulletFired(): void {
    this.session.bulletsShot++
    this.updateAccuracy()
  }

  private updateAccuracy(): void {
    if (this.session.bulletsShot === 0) {
      this.session.accuracy = 0
    } else {
      this.session.accuracy = (this.session.enemiesDefeated / this.session.bulletsShot) * 100
    }
  }

  private incrementCombo(): void {
    const maxIndex = GAME_CONFIG.COMBO.MULTIPLIERS.length - 1
    const currentIndex = GAME_CONFIG.COMBO.MULTIPLIERS.indexOf(
      this.session.comboMultiplier as 3 | 5 | 1 | 1.5 | 2 | 2.5 | 4
    )

    if (currentIndex < maxIndex) {
      this.session.comboMultiplier = GAME_CONFIG.COMBO.MULTIPLIERS[currentIndex + 1]
    }

    this.resetComboTimer()
    gameEvents.emit('COMBO_UPDATED', { multiplier: this.session.comboMultiplier })
  }

  private resetComboTimer(): void {
    if (this.comboTimeoutId) {
      clearTimeout(this.comboTimeoutId)
    }

    this.session.comboTimer = GAME_CONFIG.COMBO.TIMEOUT

    this.comboTimeoutId = window.setTimeout(() => {
      this.resetCombo()
    }, GAME_CONFIG.COMBO.TIMEOUT)
  }

  private resetCombo(): void {
    this.session.comboMultiplier = 1
    this.session.comboTimer = 0
    gameEvents.emit('COMBO_RESET')
  }

  damagePlayer(damage: number): void {
    if (this.player.invincible) {
      return
    }

    if (this.player.shieldActive) {
      this.deactivateShield()
      gameEvents.emit('SHIELD_BLOCKED_HIT', { damage })
      return
    }

    this.player.health -= damage
    this.resetCombo()

    gameEvents.emit('PLAYER_HIT', { damage, health: this.player.health })

    if (this.player.health <= 0) {
      this.onPlayerDeath()
    } else {
      this.setInvincibility(GAME_CONFIG.PLAYER.INVINCIBILITY_DURATION)
    }
  }

  private onPlayerDeath(): void {
    this.player.lives--
    gameEvents.emit('PLAYER_DEATH', { lives: this.player.lives })

    if (this.player.lives <= 0) {
      setTimeout(() => {
        this.endGame(false)
      }, 1500)
    } else {
      setTimeout(() => {
        this.respawnPlayer()
      }, GAME_CONFIG.PLAYER.RESPAWN_DELAY)
    }
  }

  private respawnPlayer(): void {
    this.player.health = this.player.maxHealth
    this.setInvincibility(GAME_CONFIG.PLAYER.INVINCIBILITY_DURATION)
    gameEvents.emit('PLAYER_RESPAWN')
  }

  private setInvincibility(duration: number): void {
    this.player.invincible = true
    this.player.invincibleUntil = performance.now() + duration

    setTimeout(() => {
      this.player.invincible = false
      this.player.invincibleUntil = 0
    }, duration)
  }

  healPlayer(amount: number): void {
    this.player.health = Math.min(this.player.health + amount, this.player.maxHealth)
    gameEvents.emit('PLAYER_HEALED', { amount, health: this.player.health })
  }

  addLife(): void {
    this.player.lives++
    gameEvents.emit('LIFE_GAINED', { lives: this.player.lives })
  }

  activateShield(duration: number = 10000): void {
    const existingTimer = this.activePowerUpTimers.get('shield')
    if (existingTimer?.timeoutId) {
      clearTimeout(existingTimer.timeoutId)
    }

    this.player.shieldActive = true
    this.player.shieldDuration = duration
    this.player.shieldStartTime = Date.now()

    const endTime = Date.now() + duration
    const timeoutId = window.setTimeout(() => {
      this.deactivateShield()
      this.activePowerUpTimers.delete('shield')
    }, duration)

    this.activePowerUpTimers.set('shield', {
      type: 'shield',
      endTime,
      timeoutId,
      remainingTime: duration
    })

    gameEvents.emit('SHIELD_ACTIVATED')
  }

  private deactivateShield(): void {
    this.player.shieldActive = false
    this.player.shieldDuration = 0
    this.player.shieldStartTime = 0

    const timer = this.activePowerUpTimers.get('shield')
    if (timer?.timeoutId) {
      clearTimeout(timer.timeoutId)
    }
    this.activePowerUpTimers.delete('shield')

    gameEvents.emit('SHIELD_DEACTIVATED')
  }

  changeWeapon(weaponType: PlayerStats['weaponType'], duration: number = 15000): void {
    if (weaponType === 'SINGLE') return

    if (this.player.weaponType === 'SINGLE') {
      this.activateWeapon(weaponType, duration)
    } else {
      this.weaponQueue.push({ type: weaponType, remainingTime: duration })
      gameEvents.emit('WEAPON_QUEUED', { weapon: weaponType, queueLength: this.weaponQueue.length })
    }
  }

  handlePlaneCollisionWithShield(enemyId: string, scoreReduction: number): void {
    if (this.player.shieldActive) {
      this.deactivateShield()
      gameEvents.emit('SHIELD_BLOCKED_PLANE_HIT', {
        enemyId,
        scoreReductionPrevented: scoreReduction
      })
    } else {
      this.session.score = Math.max(0, this.session.score - scoreReduction)
      gameEvents.emit('SCORE_REDUCED', { amount: scoreReduction })
    }
  }

  private activateWeapon(weaponType: PlayerStats['weaponType'], duration: number): void {
    const existingTimer = this.activePowerUpTimers.get('weapon')
    if (existingTimer?.timeoutId) {
      clearTimeout(existingTimer.timeoutId)
      this.activePowerUpTimers.delete('weapon')
    }

    const previousWeapon = this.player.weaponType
    this.player.weaponType = weaponType
    this.player.weaponUpgradeDuration = duration
    this.player.weaponUpgradeStartTime = Date.now()

    const endTime = Date.now() + duration
    const timeoutId = window.setTimeout(() => {
      this.onWeaponExpire()
    }, duration)

    this.activePowerUpTimers.set('weapon', {
      type: 'weapon',
      endTime,
      timeoutId,
      remainingTime: duration
    })

    gameEvents.emit('WEAPON_CHANGED', { from: previousWeapon, to: weaponType })
  }

  private onWeaponExpire(): void {
    const expiredWeapon = this.player.weaponType

    this.player.weaponType = 'SINGLE'
    this.player.weaponUpgradeDuration = 0
    this.player.weaponUpgradeStartTime = 0
    this.activePowerUpTimers.delete('weapon')

    gameEvents.emit('WEAPON_EXPIRED', { weapon: expiredWeapon })

    if (this.weaponQueue.length > 0) {
      const next = this.weaponQueue.shift()!
      this.activateWeapon(next.type, next.remainingTime)
    }
  }

  getWeaponQueue(): Array<{ type: PlayerStats['weaponType']; remainingTime: number }> {
    return [...this.weaponQueue]
  }

  activateSpeedBoost(duration: number = 8000, speedMultiplier: number = 1.5): void {
    const existingTimer = this.activePowerUpTimers.get('speed')
    if (existingTimer?.timeoutId) {
      clearTimeout(existingTimer.timeoutId)
    }

    this.player.speedBoostActive = true
    this.player.speedBoostDuration = duration
    this.player.speedBoostStartTime = Date.now()
    this.player.speed = this.basePlayerSpeed * speedMultiplier

    const endTime = Date.now() + duration
    const timeoutId = window.setTimeout(() => {
      this.player.speedBoostActive = false
      this.player.speedBoostDuration = 0
      this.player.speedBoostStartTime = 0
      this.player.speed = this.basePlayerSpeed
      this.activePowerUpTimers.delete('speed')
      gameEvents.emit('SPEED_BOOST_DEACTIVATED')
    }, duration)

    this.activePowerUpTimers.set('speed', {
      type: 'speed',
      endTime,
      timeoutId,
      remainingTime: duration
    })

    gameEvents.emit('SPEED_BOOST_ACTIVATED')
  }

  completeWave(): void {
    if (!this.currentWave || this.waveCompleting) {
      return
    }

    this.waveCompleting = true

    this.currentWave.completed = true
    this.addScore(SCORE_VALUES.WAVE_COMPLETE)

    const noDamageTaken = this.player.health === this.player.maxHealth
    if (noDamageTaken) {
      this.addScore(SCORE_VALUES.NO_DAMAGE_BONUS)
    }

    gameEvents.emit('WAVE_COMPLETE', {
      wave: this.currentWaveIndex + 1,
      bonus: noDamageTaken
    })

    setTimeout(() => {
      this.waveCompleting = false
      this.nextWave()
    }, 2500)
  }

  private nextWave(): void {
    if (this.mode === 'QUICK_PLAY') {
      this.nextQuickPlayWave()
    } else {
      this.nextStoryWave()
    }
  }

  private nextQuickPlayWave(): void {
    this.currentWaveIndex++

    const templateIndex = this.currentWaveIndex % WAVE_TEMPLATES.length
    const template = WAVE_TEMPLATES[templateIndex]
    const modifier = DIFFICULTY_MODIFIERS[this.difficulty]

    this.currentWave = {
      id: this.currentWaveIndex + 1,
      spawnInterval: template.spawnInterval,
      completed: false,
      enemies: template.enemies.map((e) => ({
        type: e.type,
        pattern: e.pattern,
        spawnDelay: e.spawnDelay,
        count: Math.ceil(e.count * modifier.enemyCountMultiplier)
      }))
    }

    this.session.currentWave = this.currentWaveIndex + 1

    this.initializeWaveEnemyCount()

    setTimeout(() => {
      gameEvents.emit('WAVE_START', {
        wave: this.session.currentWave,
        hasBoss: this.currentWave?.enemies.some((e) => e.type === 'BOSS')
      })
    }, 100)
  }

  private nextStoryWave(): void {
    this.currentWaveIndex++

    if (this.currentWaveIndex >= this.waves.length) {
      this.endGame(true)
      return
    }

    this.currentWave = this.waves[this.currentWaveIndex]
    this.session.currentWave = this.currentWaveIndex + 1

    this.initializeWaveEnemyCount()

    setTimeout(() => {
      gameEvents.emit('WAVE_START', {
        wave: this.session.currentWave,
        hasBoss: this.currentWave?.enemies.some((e) => e.type === 'BOSS')
      })
    }, 100)
  }

  saveHighScore(playerName: string = 'Player', userId?: string): boolean {
    StorageManager.addHighScore(
      {
        name: playerName,
        score: this.session.score,
        wave: this.session.currentWave,
        difficulty: this.difficulty,
        date: Date.now(),
        mode: this.mode
      },
      userId
    )

    return true
  }

  getGameState(): {
    mode: GameMode
    difficulty: GameDifficulty
    isPlaying: boolean
    isPaused: boolean
    session: GameSessionState
    player: PlayerStats
    currentWave: Wave | null
  } {
    return {
      mode: this.mode,
      difficulty: this.difficulty,
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      session: { ...this.session },
      player: { ...this.player },
      currentWave: this.currentWave
    }
  }
}

export const gameManager = GameManager.getInstance()
