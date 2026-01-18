import type { Wave, EnemyType, MovementPattern } from '../types/gameTypes'
import { EnemyController } from './enemyController'
import { gameManager } from './gameManager'
import { gameEvents } from './eventBus'

type SpawnConfig = {
  type: EnemyType
  count: number
  spawnDelay: number
  pattern: MovementPattern
}

export class EnemySpawner {
  private enemyController: EnemyController
  private currentWave: Wave | null = null
  private spawnQueue: SpawnConfig[] = []
  private spawning: boolean = false
  private spawnTimeoutId: number | null = null
  private enemiesSpawned: number = 0
  private totalEnemiesInWave: number = 0
  private bounds: { width: number; height: number }

  constructor(enemyController: EnemyController, bounds: { width: number; height: number }) {
    this.enemyController = enemyController
    this.bounds = bounds
  }

  startWave(wave: Wave): void {
    this.currentWave = wave
    this.spawnQueue = [...wave.enemies]
    this.spawning = true
    this.enemiesSpawned = 0
    this.totalEnemiesInWave = wave.enemies.reduce((sum, e) => sum + e.count, 0)

    gameEvents.emit('WAVE_START', { wave: wave.id })
    this.processSpawnQueue()
  }

  private processSpawnQueue(): void {
    if (!this.spawning || this.spawnQueue.length === 0) {
      if (this.enemiesSpawned >= this.totalEnemiesInWave) {
        this.checkWaveComplete()
      }
      return
    }

    const config = this.spawnQueue[0]
    this.spawnEnemy(config)

    config.count--
    if (config.count <= 0) {
      this.spawnQueue.shift()
    }

    this.spawnTimeoutId = window.setTimeout(() => {
      this.processSpawnQueue()
    }, config.spawnDelay)
  }

  private spawnEnemy(config: SpawnConfig): void {
    const spawnX = this.getRandomSpawnX(config.type)
    const spawnY = -100

    this.enemyController.spawnEnemy(config.type, spawnX, spawnY, config.pattern)
    this.enemiesSpawned++

    gameEvents.emit('ENEMY_SPAWNED', { type: config.type, pattern: config.pattern })
  }

  private getRandomSpawnX(type: EnemyType): number {
    const margin = 50
    const maxX = this.bounds.width - margin
    return Math.random() * (maxX - margin) + margin
  }

  private checkWaveComplete(): void {
    const activeEnemies = this.enemyController.getActiveEnemies()

    if (activeEnemies.length === 0 && this.enemiesSpawned >= this.totalEnemiesInWave) {
      this.stopSpawning()
      gameManager.completeWave()
    } else {
      setTimeout(() => this.checkWaveComplete(), 500)
    }
  }

  stopSpawning(): void {
    this.spawning = false
    this.spawnQueue = []

    if (this.spawnTimeoutId) {
      clearTimeout(this.spawnTimeoutId)
      this.spawnTimeoutId = null
    }
  }

  reset(): void {
    this.stopSpawning()
    this.currentWave = null
    this.enemiesSpawned = 0
    this.totalEnemiesInWave = 0
  }

  isSpawning(): boolean {
    return this.spawning
  }

  getProgress(): { spawned: number; total: number; remaining: number } {
    return {
      spawned: this.enemiesSpawned,
      total: this.totalEnemiesInWave,
      remaining: this.totalEnemiesInWave - this.enemiesSpawned
    }
  }
}
