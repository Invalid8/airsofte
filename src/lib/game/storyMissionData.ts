import type { StoryMission, MissionStars } from '$lib/types/gameTypes'
import { missionLoader } from './missionLoader'
import { StorageManager } from '$lib/utils/storageManager'

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
      this.missions = this.mergeSavedProgress(loadedMissions)
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
        stars: 0,
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
    return this.missions.map((mission) => this.cloneMission(mission))
  }

  getMissionById(id: number): StoryMission | undefined {
    const mission = this.missions.find((m) => m.id === id)
    return mission ? this.cloneMission(mission) : undefined
  }

  getUnlockedMissions(): StoryMission[] {
    return this.missions.filter((m) => m.unlocked).map((mission) => this.cloneMission(mission))
  }

  unlockMission(id: number): void {
    const mission = this.missions.find((m) => m.id === id)
    if (mission) {
      mission.unlocked = true
      this.saveProgress()
    }
  }

  completeMission(id: number, stars?: MissionStars): void {
    const mission = this.missions.find((m) => m.id === id)
    if (mission) {
      mission.completed = true

      if (stars !== undefined && (mission.stars === undefined || stars > mission.stars)) {
        mission.stars = stars
      }

      const nextMission = this.missions.find((m) => m.id === id + 1)
      if (nextMission) {
        nextMission.unlocked = true
      }

      if (mission.rewards?.unlockWeapon) {
        StorageManager.unlockWeapon(mission.rewards.unlockWeapon)
      }

      this.saveProgress()
    }
  }

  calculateStars(
    mission: StoryMission,
    stats: {
      score: number
      timeElapsed: number
      damageTaken: number
      accuracy: number
    }
  ): MissionStars {
    const baseScore = mission.waves.length * 1000
    const allObjectivesComplete = mission.objectives.every((obj) => obj.current >= obj.target)

    if (!allObjectivesComplete) return 0

    let stars: MissionStars = 1

    const star2Requirements = [
      stats.score >= baseScore * 1.8,
      stats.accuracy >= 60,
      stats.damageTaken < 40
    ]

    if (star2Requirements.filter(Boolean).length >= 2) stars = 2

    const star3Requirements = [
      stats.score >= baseScore * 2.5,
      stats.accuracy >= 75,
      stats.damageTaken === 0,
      stats.score >= baseScore * 3
    ]

    if (star3Requirements.filter(Boolean).length >= 3) stars = 3

    return stars
  }

  updateObjective(missionId: number, objectiveIndex: number, progress: number): void {
    const mission = this.missions.find((m) => m.id === missionId)
    if (mission && mission.objectives[objectiveIndex]) {
      mission.objectives[objectiveIndex].current = Math.min(
        progress,
        mission.objectives[objectiveIndex].target
      )
      this.saveProgress()
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
      this.saveProgress()
    }
  }

  resetAllProgress(): void {
    this.missions.forEach((mission, index) => {
      mission.completed = false
      mission.unlocked = index === 0
      mission.stars = 0
      this.resetMission(mission.id)
    })
    this.saveProgress()
  }

  reloadFromJSON(): void {
    console.log('🔄 Reloading missions from JSON...')
    this.missions = []
    this.loadMissions()
  }

  private mergeSavedProgress(missions: StoryMission[]): StoryMission[] {
    const progress = StorageManager.getPlayerProgress()

    if (progress.storyMissions.length === 0) {
      const initialized = missions.map((mission) => this.cloneMission(mission))
      StorageManager.savePlayerProgress({
        ...progress,
        storyMissions: initialized
      })
      return initialized
    }

    return missions.map((mission) => {
      const saved = progress.storyMissions.find((item) => item.id === mission.id)
      if (!saved) return this.cloneMission(mission)

      return {
        ...this.cloneMission(mission),
        unlocked: saved.unlocked || mission.unlocked,
        completed: saved.completed,
        stars: saved.stars,
        objectives: mission.objectives.map((objective, index) => ({
          ...objective,
          current: saved.objectives?.[index]?.current ?? 0
        }))
      }
    })
  }

  private saveProgress(): void {
    const progress = StorageManager.getPlayerProgress()
    StorageManager.savePlayerProgress({
      ...progress,
      storyMissions: this.missions.map((mission) => this.cloneMission(mission))
    })
  }

  private cloneMission(mission: StoryMission): StoryMission {
    return JSON.parse(JSON.stringify(mission)) as StoryMission
  }
}

export const storyMissionManager = StoryMissionManager.getInstance()
