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

type GameMode = 'QUICK_PLAY' | 'STORY_MODE'

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
    invincibleUntil: 0
  }

  public currentWave: Wave | null = null
  public waves: Wave[] = []
  private enemiesRemaining = 0
  private currentWaveIndex: number = 0

  private gameLoopId: number | null = null
  private lastFrameTime: number = 0
  private startTime: number = 0
  private comboTimeoutId: number | null = null

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
  }

  startGame(mode: GameMode, difficulty?: GameDifficulty, missionId?: number): void {
    this.mode = mode
    if (difficulty) this.difficulty = difficulty

    this.resetSession()
    this.resetPlayer()

    if (mode === 'STORY_MODE' && missionId) {
      this.initializeStoryMission(missionId)
    } else {
      this.initializeWaves()
    }

    this.isPlaying = true
    this.isPaused = false
    this.session.playing = true
    this.startTime = performance.now()
    this.lastFrameTime = this.startTime

    this.startGameLoop()

    gameEvents.emit('GAME_START', { mode, difficulty: this.difficulty, missionId })
  }

  private startGameLoop(): void {
    const loop = (timestamp: number) => {
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
      invincibleUntil: 0
    }
  }

  pauseGame(): void {
    if (!this.isPlaying) return
    this.isPaused = true
    this.session.playing = false
    gameEvents.emit('GAME_PAUSED')
  }

  resumeGame(): void {
    if (!this.isPlaying) return
    this.isPaused = false
    this.session.playing = true
    this.lastFrameTime = performance.now()
    gameEvents.emit('GAME_RESUMED')
  }

  endGame(victory: boolean = false): void {
    this.isPlaying = false
    this.isPaused = false
    this.session.playing = false

    if (this.gameLoopId) cancelAnimationFrame(this.gameLoopId)
    this.gameLoopId = null

    const finalScore = this.session.score
    const finalWave = this.session.currentWave

    if (StorageManager.isHighScore(finalScore, this.mode)) {
      gameEvents.emit('NEW_HIGH_SCORE', { score: finalScore, wave: finalWave })
    }

    gameEvents.emit('GAME_OVER', {
      victory,
      score: finalScore,
      wave: finalWave,
      stats: { ...this.session }
    })
  }

  private updateTime(deltaTime: number): void {
    this.session.timeElapsed += deltaTime
  }

  private initializeStoryMission(missionId: number): void {
    const mission = storyMissionManager.getMissionById(missionId)
    if (!mission) return

    this.waves = mission.waves.map((wave) => ({
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
    this.session.currentWave = this.currentWaveIndex + 1
  }

  addScore(points: number): void {
    const modifier = DIFFICULTY_MODIFIERS[this.difficulty].scoreMultiplier
    const comboBonus = this.session.comboMultiplier
    const finalScore = Math.floor(points * modifier * comboBonus)

    this.session.score += finalScore
    gameEvents.emit('SCORE_UPDATED', { points: finalScore, total: this.session.score })
  }

  onEnemyDestroyed(enemy: Enemy): void {
    this.session.enemiesDefeated++
    this.addScore(enemy.scoreValue)
    this.incrementCombo()

    this.enemiesRemaining--

    gameEvents.emit('ENEMY_DESTROYED', { enemy })

    if (this.enemiesRemaining === 0) {
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
    const currentIndex = GAME_CONFIG.COMBO.MULTIPLIERS.indexOf(this.session.comboMultiplier as any)

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
    if (this.player.invincible || this.player.shieldActive) {
      if (this.player.shieldActive) {
        this.player.shieldActive = false
        gameEvents.emit('SHIELD_BROKEN')
      }
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
      this.endGame(false)
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

  activateShield(duration: number): void {
    this.player.shieldActive = true
    gameEvents.emit('SHIELD_ACTIVATED')

    setTimeout(() => {
      this.player.shieldActive = false
      gameEvents.emit('SHIELD_DEACTIVATED')
    }, duration)
  }

  changeWeapon(weaponType: PlayerStats['weaponType'], duration?: number): void {
    const previousWeapon = this.player.weaponType
    this.player.weaponType = weaponType
    gameEvents.emit('WEAPON_CHANGED', { from: previousWeapon, to: weaponType })

    if (duration) {
      setTimeout(() => {
        this.player.weaponType = 'SINGLE'
        gameEvents.emit('WEAPON_EXPIRED', { weapon: weaponType })
      }, duration)
    }
  }

  completeWave(): void {
    if (!this.currentWave) return

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

    this.nextWave()
  }

  private nextWave(): void {
    this.currentWaveIndex++

    if (this.currentWaveIndex >= this.waves.length) {
      this.endGame(true)
      return
    }

    this.currentWave = this.waves[this.currentWaveIndex]
    this.session.currentWave = this.currentWaveIndex + 1

    gameEvents.emit('WAVE_START', {
      wave: this.session.currentWave
    })
  }

  saveHighScore(playerName: string = 'Player'): void {
    StorageManager.addHighScore({
      name: playerName,
      score: this.session.score,
      wave: this.session.currentWave,
      difficulty: this.difficulty,
      date: Date.now(),
      mode: this.mode
    })
  }

  getGameState() {
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
