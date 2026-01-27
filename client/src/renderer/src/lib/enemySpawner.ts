import type { EnemyType, MovementPattern, WaveInstance } from '../types/gameTypes'
import { EnemyController } from './enemyController'

type SpawnConfig = {
  type: EnemyType
  count: number
  spawnDelay: number
  pattern: MovementPattern
}

export class EnemySpawner {
  private enemyController: EnemyController
  private spawnQueue: SpawnConfig[] = []
  private spawnTimeoutId: number | null = null
  private bounds: { width: number; height: number }
  private isSpawning: boolean = false

  constructor(enemyController: EnemyController, bounds: { width: number; height: number }) {
    this.enemyController = enemyController
    this.bounds = bounds
  }

  startWave(wave: WaveInstance): void {
    this.stop()
    this.spawnQueue = wave.enemies.map((e) => ({ ...e }))
    this.isSpawning = true
    this.processQueue()
  }

  private processQueue(): void {
    if (!this.isSpawning) return

    if (this.spawnQueue.length === 0) {
      this.isSpawning = false
      return
    }

    const config = this.spawnQueue[0]
    this.spawnEnemy(config)

    config.count--
    if (config.count <= 0) {
      this.spawnQueue.shift()
    }

    this.spawnTimeoutId = window.setTimeout(() => {
      this.processQueue()
    }, config.spawnDelay)
  }

  private spawnEnemy(config: SpawnConfig): void {
    const enemyWidth = this.getEnemyWidth(config.type)
    const margin = 50

    const minX = margin
    const maxX = this.bounds.width - enemyWidth - margin

    const x = Math.random() * (maxX - minX) + minX

    const y = -150

    this.enemyController.spawnEnemy(config.type, x, y, config.pattern)
  }

  private getEnemyWidth(type: EnemyType): number {
    switch (type) {
      case 'BASIC':
        return 80
      case 'SCOUT':
        return 60
      case 'BOMBER':
        return 120
      case 'BOSS':
        return 250
      default:
        return 80
    }
  }

  stop(): void {
    this.isSpawning = false
    if (this.spawnTimeoutId) {
      clearTimeout(this.spawnTimeoutId)
      this.spawnTimeoutId = null
    }
    this.spawnQueue = []
  }
}
