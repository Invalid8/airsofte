import type { StoryMission } from '../types/gameTypes'
import { missionLoader } from './missionLoader'

export class StoryMissionManager {
  private missions: StoryMission[] = []
  private static instance: StoryMissionManager

  private constructor() {
    this.loadMissions()
  }

  static getInstance(): StoryMissionManager {
    if (!StoryMissionManager.instance) {
      StoryMissionManager.instance = new StoryMissionManager()
    }
    return StoryMissionManager.instance
  }

  private loadMissions(): void {
    const loadedMissions = missionLoader.loadMissions()

    if (loadedMissions.length > 0) {
      this.missions = loadedMissions
      console.log(`✅ Story Manager: Loaded ${this.missions.length} missions from JSON`)
    } else {
      console.warn('⚠️ Story Manager: No missions loaded, using fallback')
      this.missions = this.getFallbackMissions()
    }
  }

  private getFallbackMissions(): StoryMission[] {
    return [
      {
        id: 1,
        title: 'First Contact',
        description: 'Learn the basics of combat.',
        unlocked: true,
        completed: false,
        objectives: [
          {
            type: 'DESTROY',
            target: 10,
            current: 0,
            description: 'Destroy 10 enemy fighters'
          }
        ],
        waves: [
          {
            id: 1,
            enemies: [{ type: 'BASIC', count: 5, spawnDelay: 800, pattern: 'STRAIGHT' }],
            spawnInterval: 1000,
            completed: false
          }
        ],
        hasBoss: false
      }
    ]
  }

  getMissions(): StoryMission[] {
    return this.missions.map((m) => ({ ...m }))
  }

  getMissionById(id: number): StoryMission | undefined {
    const mission = this.missions.find((m) => m.id === id)
    return mission ? { ...mission } : undefined
  }

  getUnlockedMissions(): StoryMission[] {
    return this.missions.filter((m) => m.unlocked).map((m) => ({ ...m }))
  }

  unlockMission(id: number): void {
    const mission = this.missions.find((m) => m.id === id)
    if (mission) {
      mission.unlocked = true
    }
  }

  completeMission(id: number): void {
    const mission = this.missions.find((m) => m.id === id)
    if (mission) {
      mission.completed = true

      const nextMission = this.missions.find((m) => m.id === id + 1)
      if (nextMission) {
        nextMission.unlocked = true
      }
    }
  }

  updateObjective(missionId: number, objectiveIndex: number, progress: number): void {
    const mission = this.missions.find((m) => m.id === missionId)
    if (mission && mission.objectives[objectiveIndex]) {
      mission.objectives[objectiveIndex].current = Math.min(
        progress,
        mission.objectives[objectiveIndex].target
      )
    }
  }

  checkObjectivesComplete(missionId: number): boolean {
    const mission = this.missions.find((m) => m.id === missionId)
    if (!mission) return false

    return mission.objectives.every((obj) => obj.current >= obj.target)
  }

  resetMission(id: number): void {
    const mission = this.missions.find((m) => m.id === id)
    if (mission) {
      mission.objectives.forEach((obj) => (obj.current = 0))
      mission.waves.forEach((wave) => (wave.completed = false))
    }
  }

  resetAllProgress(): void {
    this.missions.forEach((mission, index) => {
      mission.completed = false
      mission.unlocked = index === 0
      this.resetMission(mission.id)
    })
  }

  reloadFromJSON(): void {
    console.log('🔄 Reloading missions from JSON...')
    this.missions = []
    this.loadMissions()
  }
}

export const storyMissionManager = StoryMissionManager.getInstance()
