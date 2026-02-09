export interface TimeBasedObjective {
  type: 'SURVIVE'
  duration: number
  description: string
}

export interface GameObjective {
  type: 'DESTROY' | 'SURVIVE' | 'COLLECT' | 'COMBO'
  target?: number
  duration?: number
  description: string
}

class TimeBasedObjectiveManager {
  private timerInterval: number | null = null
  private startTime: number = 0
  private targetDuration: number = 0
  private isActive: boolean = false
  private onComplete: (() => void) | null = null

  start(objective: TimeBasedObjective, onComplete: () => void) {
    this.isActive = true
    this.startTime = Date.now()
    this.targetDuration = objective.duration
    this.onComplete = onComplete

    this.timerInterval = window.setInterval(() => {
      const elapsed = Date.now() - this.startTime

      if (elapsed >= this.targetDuration) {
        this.complete()
      }
    }, 100)
  }

  complete() {
    this.isActive = false

    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }

    if (this.onComplete) {
      this.onComplete()
    }
  }

  getTimeRemaining(): number {
    if (!this.isActive) return 0

    const elapsed = Date.now() - this.startTime
    const remaining = Math.max(0, this.targetDuration - elapsed)
    return remaining
  }

  getTimeElapsed(): number {
    if (!this.isActive) return 0
    return Date.now() - this.startTime
  }

  isTimerActive(): boolean {
    return this.isActive
  }

  stop() {
    this.isActive = false

    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
  }
}

export const timeBasedObjectiveManager = new TimeBasedObjectiveManager()

class CleanupPhaseManager {
  private isActive: boolean = false
  private checkInterval: number | null = null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  start(enemies: any[], onComplete: () => void, maxWait: number = 10000) {
    if (this.isActive) return

    this.isActive = true
    const startTime = Date.now()

    this.checkInterval = window.setInterval(() => {
      const aliveEnemies = enemies.filter((e) => e.health > 0 && e.y < 650)
      const elapsed = Date.now() - startTime

      if (aliveEnemies.length === 0 || elapsed >= maxWait) {
        this.stop()
        onComplete()
      }
    }, 500)
  }

  stop() {
    this.isActive = false

    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  isInCleanup(): boolean {
    return this.isActive
  }
}

export const cleanupPhaseManager = new CleanupPhaseManager()

export function isTimeBasedObjective(objective: GameObjective): boolean {
  return objective.type === 'SURVIVE' && typeof objective.duration === 'number'
}

export function shouldContinueWaves(
  objectives: GameObjective[],
  currentWave: number,
  totalWaves: number
): boolean {
  const hasTimeObjective = objectives.some((obj) => isTimeBasedObjective(obj))

  if (hasTimeObjective && timeBasedObjectiveManager.isTimerActive()) {
    return true
  }

  return currentWave < totalWaves
}

export function handleObjectiveCompletion(
  objectives: GameObjective[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enemies: any[],
  onVictory: () => void
) {
  const hasTimeObjective = objectives.some((obj) => isTimeBasedObjective(obj))

  if (hasTimeObjective) {
    cleanupPhaseManager.start(enemies, onVictory, 10000)
  } else {
    const aliveCount = enemies.filter((e) => e.health > 0).length

    if (aliveCount > 0) {
      cleanupPhaseManager.start(enemies, onVictory, 10000)
    } else {
      onVictory()
    }
  }
}
