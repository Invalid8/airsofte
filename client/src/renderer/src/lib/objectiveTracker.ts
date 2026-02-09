import { gameEvents } from './eventBus'
import type { StoryMission } from '../types/gameTypes'

type Objective = {
  type: 'DESTROY' | 'SURVIVE' | 'PROTECT' | 'COLLECT' | 'NO_DAMAGE' | 'COMBO'
  target: number
  current: number
  description: string
}

interface TrackedObjective extends Objective {
  completed: boolean
  failed: boolean
}

class ObjectiveTracker {
  private objectives: TrackedObjective[] = []
  private currentMission: StoryMission | null = null
  private surviveTimer: number | null = null
  private surviveStartTime: number = 0
  private surviveTargetDuration: number = 0
  private isTimerActive: boolean = false

  startMission(mission: StoryMission): void {
    this.reset()
    this.currentMission = mission

    this.objectives = mission.objectives.map(obj => ({
      ...obj,
      current: 0,
      completed: false,
      failed: false
    }))

    const surviveObj = this.objectives.find(obj =>
      obj.type === 'SURVIVE' && typeof obj.target === 'number'
    )

    if (surviveObj && surviveObj.target) {
      this.startSurviveTimer(surviveObj.target)
    }

    gameEvents.emit('OBJECTIVES_UPDATED', {
      objectives: this.objectives,
      mission: this.currentMission
    })
  }

  private startSurviveTimer(durationMs: number): void {
    this.surviveStartTime = Date.now()
    this.surviveTargetDuration = durationMs
    this.isTimerActive = true

    this.surviveTimer = window.setInterval(() => {
      const elapsed = Date.now() - this.surviveStartTime

      if (elapsed >= this.surviveTargetDuration) {
        this.completeSurviveObjective()
      }
    }, 100)
  }

  private completeSurviveObjective(): void {
    if (this.surviveTimer) {
      clearInterval(this.surviveTimer)
      this.surviveTimer = null
    }
    this.isTimerActive = false

    const surviveObj = this.objectives.find(obj => obj.type === 'SURVIVE')
    if (surviveObj && !surviveObj.completed) {
      surviveObj.completed = true
      surviveObj.current = surviveObj.target || 0

      gameEvents.emit('OBJECTIVE_COMPLETED', { objective: surviveObj })
      gameEvents.emit('SURVIVE_OBJECTIVE_COMPLETE')
      gameEvents.emit('OBJECTIVES_UPDATED', {
        objectives: this.objectives,
        mission: this.currentMission
      })
    }
  }

  updateObjective(type: string, value: number): void {
    const objective = this.objectives.find(obj => obj.type === type && !obj.completed)

    if (!objective) return

    const previousValue = objective.current
    objective.current = value

    if (objective.target && objective.current >= objective.target) {
      objective.completed = true
      gameEvents.emit('OBJECTIVE_COMPLETED', { objective })
    } else if (objective.current > previousValue) {
      const progress = objective.target
        ? (objective.current / objective.target) * 100
        : 0

      gameEvents.emit('OBJECTIVE_UPDATED', {
        objective,
        progress
      })
    }

    gameEvents.emit('OBJECTIVES_UPDATED', {
      objectives: this.objectives,
      mission: this.currentMission
    })
  }

  incrementObjective(type: string, amount: number = 1): void {
    const objective = this.objectives.find(obj => obj.type === type && !obj.completed)

    if (!objective) return

    this.updateObjective(type, objective.current + amount)
  }

  failObjective(type: string): void {
    const objective = this.objectives.find(obj => obj.type === type)

    if (!objective || objective.completed || objective.failed) return

    objective.failed = true

    gameEvents.emit('OBJECTIVE_FAILED', { objective })
    gameEvents.emit('OBJECTIVES_UPDATED', {
      objectives: this.objectives,
      mission: this.currentMission
    })
  }

  getObjectives(): TrackedObjective[] {
    return this.objectives
  }

  getObjective(type: string): TrackedObjective | undefined {
    return this.objectives.find(obj => obj.type === type)
  }

  areAllObjectivesComplete(): boolean {
    return this.objectives.length > 0 &&
           this.objectives.every(obj => obj.completed)
  }

  hasFailedObjectives(): boolean {
    return this.objectives.some(obj => obj.failed)
  }

  checkSurviveObjective(): void {
    const surviveObj = this.objectives.find(obj => obj.type === 'SURVIVE')

    if (!surviveObj || surviveObj.completed || surviveObj.failed) return

    if (this.isTimerActive) {
      const timeRemaining = this.getSurviveTimeRemaining()
      surviveObj.current = this.surviveTargetDuration - timeRemaining
    }
  }

  getSurviveTimeRemaining(): number {
    if (!this.isTimerActive) return 0
    const elapsed = Date.now() - this.surviveStartTime
    return Math.max(0, this.surviveTargetDuration - elapsed)
  }

  getSurviveTimeElapsed(): number {
    if (!this.isTimerActive) return 0
    return Date.now() - this.surviveStartTime
  }

  isSurviveTimerActive(): boolean {
    return this.isTimerActive
  }

  hasSurviveObjective(): boolean {
    return this.objectives.some(obj =>
      obj.type === 'SURVIVE' && typeof obj.target === 'number'
    )
  }

  reset(): void {
    if (this.surviveTimer) {
      clearInterval(this.surviveTimer)
      this.surviveTimer = null
    }
    this.isTimerActive = false
    this.objectives = []
    this.currentMission = null
  }
}

export const objectiveTracker = new ObjectiveTracker()
