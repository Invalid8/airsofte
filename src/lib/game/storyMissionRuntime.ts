import type { GameSessionState, PlayerStats, StoryMission, Wave } from '$lib/types/gameTypes'
import { objectiveTracker } from './objectiveTracker'
import { missionEventManager } from './missionEventManager'
import { storyMissionManager } from './storyMissionData'

export type StoryWaveDecision =
  | { type: 'NEXT_WAVE'; wave: Wave; displayWave: number }
  | { type: 'MISSION_COMPLETE' }

export class StoryMissionRuntime {
  private mission: StoryMission | null = null
  private continuationWaveCount = 0

  startMission(missionId: number): StoryMission | null {
    this.reset()
    storyMissionManager.resetMission(missionId)

    const mission = storyMissionManager.getMissionById(missionId)
    if (!mission) return null

    this.mission = mission
    this.continuationWaveCount = 0

    objectiveTracker.startMission(mission)
    missionEventManager.startMission(mission.events ?? [])

    return this.cloneMission(mission)
  }

  reset(): void {
    this.mission = null
    this.continuationWaveCount = 0
    objectiveTracker.reset()
    missionEventManager.clearEvents()
  }

  getMission(): StoryMission | null {
    return this.mission ? this.cloneMission(this.mission) : null
  }

  getInitialWaves(): Wave[] {
    if (!this.mission) return []
    return this.mission.waves.map((wave) => this.cloneWave(wave))
  }

  update(
    session: GameSessionState,
    player: PlayerStats,
    enemiesRemaining: number
  ): void {
    if (!this.mission) return

    objectiveTracker.checkSurviveObjective()
    missionEventManager.update({
      timeElapsed: session.timeElapsed,
      currentWave: session.currentWave,
      enemiesRemaining,
      playerHealth: player.health,
      playerMaxHealth: player.maxHealth
    })
  }

  decideNextWave(nextWaveIndex: number): StoryWaveDecision {
    if (!this.mission) {
      return { type: 'MISSION_COMPLETE' }
    }

    if (nextWaveIndex < this.mission.waves.length) {
      return {
        type: 'NEXT_WAVE',
        wave: this.cloneWave(this.mission.waves[nextWaveIndex]),
        displayWave: nextWaveIndex + 1
      }
    }

    if (objectiveTracker.areAllObjectivesComplete()) {
      return { type: 'MISSION_COMPLETE' }
    }

    const displayWave = nextWaveIndex + 1
    return {
      type: 'NEXT_WAVE',
      wave: this.createContinuationWave(displayWave),
      displayWave
    }
  }

  areRequiredObjectivesComplete(): boolean {
    return objectiveTracker.areAllObjectivesComplete()
  }

  private createContinuationWave(displayWave: number): Wave {
    const mission = this.mission!
    const sourceWave = mission.waves[this.continuationWaveCount % mission.waves.length]
    this.continuationWaveCount++

    const enemies = sourceWave.enemies
      .filter((enemy) => enemy.type !== 'BOSS')
      .slice(0, 2)
      .map((enemy) => ({
        ...enemy,
        count: Math.max(1, Math.ceil(enemy.count * 0.6)),
        spawnDelay: Math.max(350, enemy.spawnDelay)
      }))

    return {
      id: 10_000 + displayWave,
      enemies:
        enemies.length > 0
          ? enemies
          : [{ type: 'BASIC', count: 4, spawnDelay: 700, pattern: 'STRAIGHT' }],
      spawnInterval: sourceWave.spawnInterval,
      completed: false
    }
  }

  private cloneMission(mission: StoryMission): StoryMission {
    return JSON.parse(JSON.stringify(mission)) as StoryMission
  }

  private cloneWave(wave: Wave): Wave {
    return JSON.parse(JSON.stringify(wave)) as Wave
  }
}

export const storyMissionRuntime = new StoryMissionRuntime()
