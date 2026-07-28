import type { GameSessionState, PlayerStats, Wave, GameDifficulty, Enemy } from '$lib/types/gameTypes'
import {
  GAME_CONFIG,
  DIFFICULTY_MODIFIERS,
  SCORE_VALUES
} from '$lib/config/gameConstants'
import { WAVE_TEMPLATES, WEAPON_CONFIG } from '$lib/game/presets'
import { StorageManager } from '$lib/utils/storageManager'
import { gameEvents } from './eventBus'
import { storyMissionManager } from './storyMissionData'
import { ScoreSystem } from './scoreSystem'
import { StatusEffectSystem } from './statusEffectSystem'
import { TimedActionSystem } from './timedActionSystem'
import { buildWaveFromTemplate, buildWaveSet } from './waveFactory'

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
    fireRate: WEAPON_CONFIG.SINGLE.fireRate,
    weaponType: 'SINGLE',
    shieldActive: false,
    invincible: false,
    invincibleUntil: 0
  }

  public currentWave: Wave | null = null
  public waves: Wave[] = []
  private enemiesSpawned = 0
  private enemiesDestroyedInWave = 0
  private currentWaveIndex: number = 0

  private statusEffects = new StatusEffectSystem()
  private timedActions = new TimedActionSystem()
  private scoreSystem = new ScoreSystem(this.session, () => this.difficulty, this.timedActions)
  private waveCompleting = false
  private playerDown = false

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

    if (mode === 'STORY_MODE' && missionId) {
      this.initializeStoryMission(missionId)
    } else {
      this.initializeWaves()
    }

    this.isPlaying = true
    this.isPaused = false
    this.session.playing = true
    this.initializeWaveEnemyCount()

    gameEvents.emit('GAME_START', { mode, difficulty: this.difficulty, missionId })

    this.scheduleWaveStart(1500)
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
    this.playerDown = false
    this.statusEffects.clearAll()
    this.timedActions.cancelAll()
    this.scoreSystem.setSession(this.session)
  }

  private resetPlayer(): void {
    this.player = {
      health: GAME_CONFIG.PLAYER.MAX_HEALTH,
      maxHealth: GAME_CONFIG.PLAYER.MAX_HEALTH,
      lives: GAME_CONFIG.PLAYER.MAX_LIVES,
      speed: GAME_CONFIG.PLAYER.SPEED,
      fireRate: WEAPON_CONFIG.SINGLE.fireRate,
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
    gameEvents.emit('GAME_RESUMED')
  }

  endGame(victory: boolean = false): void {
    this.isPlaying = false
    this.isPaused = false
    this.session.playing = false

    const finalScore = this.session.score
    const finalWave = this.session.currentWave

    this.timedActions.cancel('combo')
    this.timedActions.cancel('waveStart')
    this.timedActions.cancel('waveComplete')
    this.timedActions.cancel('respawn')
    this.timedActions.schedule('gameOver', 500, () => {
      gameEvents.emit('GAME_OVER', {
        victory: victory && this.mode === 'STORY_MODE',
        score: finalScore,
        wave: finalWave,
        stats: { ...this.session }
      })
    })
  }

  update(deltaTime: number): void {
    if (!this.isPlaying || this.isPaused) return
    this.updateTime(deltaTime)
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

    this.waves = buildWaveSet(WAVE_TEMPLATES, modifier.enemyCountMultiplier)

    this.currentWaveIndex = 0
    this.currentWave = this.waves[0]
    this.session.currentWave = this.currentWaveIndex + 1
  }

  addScore(points: number): void {
    this.scoreSystem.addScore(points)
  }

  onEnemyDestroyed(enemy: Enemy): void {
    this.enemiesDestroyedInWave++
    this.scoreSystem.onEnemyDestroyed(enemy.scoreValue)

    gameEvents.emit('ENEMY_DESTROYED', { enemy })

    if (enemy.type === 'BOSS') {
      gameEvents.emit('BOSS_DEFEATED', { enemy })
    }

    if (this.enemiesDestroyedInWave >= this.enemiesSpawned && !this.waveCompleting) {
      this.completeWave()
    }
  }

  onEnemyEscaped(enemy: Enemy): void {
    if (!enemy.active || this.waveCompleting) return

    this.enemiesDestroyedInWave++
    gameEvents.emit('ENEMY_ESCAPED', { enemy })

    if (this.enemiesDestroyedInWave >= this.enemiesSpawned) {
      this.completeWave()
    }
  }

  onBulletFired(): void {
    this.scoreSystem.onBulletFired()
  }

  private emitPlayerStateChanged(): void {
    gameEvents.emit('PLAYER_STATE_CHANGED', { player: { ...this.player } })
  }

  damagePlayer(damage: number): void {
    if (!this.isPlaying || this.playerDown || this.player.health <= 0) return

    if (this.player.invincible || this.player.shieldActive) {
      if (this.player.shieldActive) {
        this.statusEffects.clear('shield')
        this.player.shieldActive = false
        gameEvents.emit('SHIELD_BROKEN')
        this.setInvincibility(350)
      }
      return
    }

    this.player.health = Math.max(0, this.player.health - damage)
    this.scoreSystem.resetCombo()

    gameEvents.emit('PLAYER_HIT', { damage, health: this.player.health })

    if (this.player.health <= 0) {
      this.onPlayerDeath()
    } else {
      this.setInvincibility(GAME_CONFIG.PLAYER.INVINCIBILITY_DURATION)
    }
  }

  private onPlayerDeath(): void {
    if (this.playerDown) return

    this.playerDown = true
    this.player.invincible = true
    this.player.invincibleUntil = Number.POSITIVE_INFINITY
    this.statusEffects.clear('invincibility')
    this.player.lives = Math.max(0, this.player.lives - 1)
    gameEvents.emit('PLAYER_DEATH', { lives: this.player.lives })

    if (this.player.lives <= 0) {
      this.timedActions.schedule('gameOver', 1500, () => this.endGame(false))
    } else {
      this.timedActions.schedule('respawn', GAME_CONFIG.PLAYER.RESPAWN_DELAY, () => this.respawnPlayer())
    }
  }

  private respawnPlayer(): void {
    this.playerDown = false
    this.player.health = this.player.maxHealth
    this.setInvincibility(GAME_CONFIG.PLAYER.INVINCIBILITY_DURATION)
    gameEvents.emit('PLAYER_RESPAWN')
  }

  private setInvincibility(duration: number): void {
    this.player.invincible = true
    this.player.invincibleUntil = performance.now() + duration
    this.emitPlayerStateChanged()

    this.statusEffects.start('invincibility', duration, () => {
      if (this.playerDown) return
      this.player.invincible = false
      this.player.invincibleUntil = 0
      this.emitPlayerStateChanged()
    })
  }

  healPlayer(amount: number): void {
    this.player.health = Math.min(this.player.health + amount, this.player.maxHealth)
    gameEvents.emit('PLAYER_HEALED', { amount, health: this.player.health })
    this.emitPlayerStateChanged()
  }

  addLife(): void {
    this.player.lives++
    gameEvents.emit('LIFE_GAINED', { lives: this.player.lives })
    this.emitPlayerStateChanged()
  }

  activateShield(duration: number): void {
    this.player.shieldActive = true
    gameEvents.emit('SHIELD_ACTIVATED')
    this.emitPlayerStateChanged()

    this.statusEffects.start('shield', duration, () => {
      this.player.shieldActive = false
      gameEvents.emit('SHIELD_DEACTIVATED')
      this.emitPlayerStateChanged()
    })
  }

  changeWeapon(weaponType: PlayerStats['weaponType'], duration?: number): void {
    const previousWeapon = this.player.weaponType
    this.player.weaponType = weaponType
    this.player.fireRate = WEAPON_CONFIG[weaponType].fireRate
    gameEvents.emit('WEAPON_CHANGED', { from: previousWeapon, to: weaponType })
    this.emitPlayerStateChanged()

    if (duration) {
      this.statusEffects.start('weapon', duration, () => {
        this.player.weaponType = 'SINGLE'
        this.player.fireRate = WEAPON_CONFIG.SINGLE.fireRate
        gameEvents.emit('WEAPON_EXPIRED', { weapon: weaponType })
        this.emitPlayerStateChanged()
      })
    }
  }

  activateSpeedBoost(multiplier: number, duration: number): void {
    this.statusEffects.clear('speed')

    this.player.speed = GAME_CONFIG.PLAYER.SPEED * multiplier
    gameEvents.emit('SPEED_BOOST_ACTIVATED', { multiplier, speed: this.player.speed })
    this.emitPlayerStateChanged()

    this.statusEffects.start('speed', duration, () => {
      this.player.speed = GAME_CONFIG.PLAYER.SPEED
      gameEvents.emit('SPEED_BOOST_EXPIRED')
      this.emitPlayerStateChanged()
    })
  }

  clearTimedStatusEffects(): void {
    this.statusEffects.clearAll()
    this.player.invincible = false
    this.player.invincibleUntil = 0
    this.player.shieldActive = false
    this.player.weaponType = 'SINGLE'
    this.player.fireRate = WEAPON_CONFIG.SINGLE.fireRate
    this.player.speed = GAME_CONFIG.PLAYER.SPEED
    this.emitPlayerStateChanged()
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

    this.timedActions.schedule('waveComplete', 2500, () => {
      this.waveCompleting = false
      this.nextWave()
    })
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

    this.currentWave = buildWaveFromTemplate(
      template,
      this.currentWaveIndex + 1,
      modifier.enemyCountMultiplier
    )

    this.session.currentWave = this.currentWaveIndex + 1

    this.initializeWaveEnemyCount()

    this.scheduleWaveStart(100)
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

    this.scheduleWaveStart(100)
  }

  private scheduleWaveStart(delay: number): void {
    this.timedActions.schedule('waveStart', delay, () => {
      gameEvents.emit('WAVE_START', {
        wave: this.session.currentWave,
        hasBoss: this.currentWave?.enemies.some((e) => e.type === 'BOSS')
      })
    })
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
