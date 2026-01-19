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

  constructor(enemyController: EnemyController, bounds: { width: number; height: number }) {
    this.enemyController = enemyController
    this.bounds = bounds
  }

  startWave(wave: WaveInstance): void {
    this.stop()
    this.spawnQueue = wave.enemies.map((e) => ({ ...e }))
    this.processQueue()
  }

  private processQueue(): void {
    if (this.spawnQueue.length === 0) return

    const config = this.spawnQueue[0]
    this.spawnEnemy(config)

    config.count--
    if (config.count <= 0) this.spawnQueue.shift()

    this.spawnTimeoutId = window.setTimeout(() => this.processQueue(), config.spawnDelay)
  }

  private spawnEnemy(config: SpawnConfig): void {
    const x = Math.random() * (this.bounds.width - 100) + 50
    const y = -100

    this.enemyController.spawnEnemy(config.type, x, y, config.pattern)
  }

  stop(): void {
    if (this.spawnTimeoutId) {
      clearTimeout(this.spawnTimeoutId)
      this.spawnTimeoutId = null
    }
    this.spawnQueue = []
  }
}
