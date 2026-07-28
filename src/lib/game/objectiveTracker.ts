import type { StoryMission } from '$lib/types/gameTypes'
import { gameEvents } from './eventBus'
import { storyMissionManager } from './storyMissionData'

export type ObjectiveStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'BONUS'
export type BonusObjective = {
  description: string
  target: number
  current: number
  reward: number
}

export class ObjectiveTracker {
  private currentMission: StoryMission | null = null
  private objectiveStatuses: Map<number, ObjectiveStatus> = new Map()
  private bonusObjectives: BonusObjective[] = []
  private comboTracker: number = 0
  private noDamageTaken: boolean = true
  private missionStartTime: number = 0
  private unsubscribers: Array<() => void> = []

  startMission(mission: StoryMission): void {
    this.clearEventListeners()
    this.currentMission = mission
    this.objectiveStatuses.clear()
    this.bonusObjectives = []
    this.comboTracker = 0
    this.noDamageTaken = true
    this.missionStartTime = Date.now()

    mission.objectives.forEach((_, index) => {
      this.objectiveStatuses.set(index, 'ACTIVE')
    })

    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.unsubscribers = [
      gameEvents.on('ENEMY_DESTROYED', () => {
        this.updateObjective('DESTROY', 1)
      }),
      gameEvents.on('POWERUP_COLLECTED', () => {
        this.updateObjective('COLLECT', 1)
      }),
      gameEvents.on('PLAYER_HIT', () => {
        this.noDamageTaken = false
        this.checkNoDamageObjective()
      }),
      gameEvents.on('COMBO_UPDATED', (event) => {
        if (event.data?.multiplier > this.comboTracker) {
          this.comboTracker = event.data.multiplier
          this.updateObjective('COMBO', this.comboTracker)
        }
      }),
      gameEvents.on('ADD_BONUS_OBJECTIVE', (event) => {
        this.addBonusObjective(event.data)
      })
    ]
  }

  updateObjective(type: string, value: number): void {
    if (!this.currentMission) return

    const mission = this.currentMission

    mission.objectives.forEach((objective, index) => {
      if (objective.type === type && this.objectiveStatuses.get(index) === 'ACTIVE') {
        objective.current = Math.min(objective.current + value, objective.target)

        if (objective.current >= objective.target) {
          this.completeObjective(index)
        }

        storyMissionManager.updateObjective(mission.id, index, objective.current)

        gameEvents.emit('OBJECTIVE_UPDATED', {
          index,
          objective,
          progress: (objective.current / objective.target) * 100
        })
      }
    })
  }

  checkSurviveObjective(): void {
    if (!this.currentMission) return

    const mission = this.currentMission
    const elapsed = Date.now() - this.missionStartTime

    mission.objectives.forEach((objective, index) => {
      if (objective.type === 'SURVIVE' && this.objectiveStatuses.get(index) === 'ACTIVE') {
        objective.current = elapsed

        if (elapsed >= objective.target) {
          this.completeObjective(index)
        }

        storyMissionManager.updateObjective(mission.id, index, objective.current)

        gameEvents.emit('OBJECTIVE_UPDATED', {
          index,
          objective,
          progress: (elapsed / objective.target) * 100
        })
      }
    })
  }

  private checkNoDamageObjective(): void {
    if (!this.currentMission) return

    this.currentMission.objectives.forEach((objective, index) => {
      if (objective.type === 'NO_DAMAGE' && this.objectiveStatuses.get(index) === 'ACTIVE') {
        this.objectiveStatuses.set(index, 'FAILED')

        gameEvents.emit('OBJECTIVE_FAILED', {
          index,
          objective
        })
      }
    })
  }

  private completeObjective(index: number): void {
    this.objectiveStatuses.set(index, 'COMPLETED')

    gameEvents.emit('OBJECTIVE_COMPLETED', {
      index,
      objective: this.currentMission!.objectives[index]
    })
  }

  addBonusObjective(data: { description: string; target: number; reward: number }): void {
    this.bonusObjectives.push({
      ...data,
      current: 0
    })

    gameEvents.emit('BONUS_OBJECTIVE_ADDED', {
      objective: this.bonusObjectives[this.bonusObjectives.length - 1]
    })
  }

  updateBonusObjective(index: number, value: number): void {
    if (this.bonusObjectives[index]) {
      this.bonusObjectives[index].current += value

      if (this.bonusObjectives[index].current >= this.bonusObjectives[index].target) {
        this.completeBonusObjective(index)
      }
    }
  }

  private completeBonusObjective(index: number): void {
    const bonus = this.bonusObjectives[index]

    gameEvents.emit('BONUS_OBJECTIVE_COMPLETED', {
      objective: bonus,
      reward: bonus.reward
    })
  }

  areAllObjectivesComplete(): boolean {
    if (!this.currentMission) return false

    return this.currentMission.objectives.every((_, index) => {
      const status = this.objectiveStatuses.get(index)
      return status === 'COMPLETED'
    })
  }

  getObjectiveStatus(index: number): ObjectiveStatus {
    return this.objectiveStatuses.get(index) || 'ACTIVE'
  }

  getBonusObjectives(): BonusObjective[] {
    return this.bonusObjectives
  }

  getCompletionPercentage(): number {
    if (!this.currentMission || this.currentMission.objectives.length === 0) return 0

    const completed = Array.from(this.objectiveStatuses.values()).filter(
      (status) => status === 'COMPLETED'
    ).length

    return (completed / this.currentMission.objectives.length) * 100
  }

  getMissionSummary() {
    return {
      objectives: this.currentMission?.objectives.map((obj, index) => ({
        ...obj,
        status: this.objectiveStatuses.get(index)
      })),
      bonusObjectives: this.bonusObjectives,
      noDamageTaken: this.noDamageTaken,
      completionPercentage: this.getCompletionPercentage()
    }
  }

  reset(): void {
    this.clearEventListeners()
    this.currentMission = null
    this.objectiveStatuses.clear()
    this.bonusObjectives = []
    this.comboTracker = 0
    this.noDamageTaken = true
  }

  private clearEventListeners(): void {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe())
    this.unsubscribers = []
  }
}

export const objectiveTracker = new ObjectiveTracker()
