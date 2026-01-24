import type { StoryMission } from '../types/gameTypes'
import type { MissionCollection, JSONMission } from '../types/missionSchema'
import { validateMissionCollection } from '../types/missionSchema'
import missionsData from '../data/missions.json'

export class MissionLoader {
  private static instance: MissionLoader
  private missions: Map<number, StoryMission> = new Map()
  private loaded: boolean = false

  private constructor() {}

  static getInstance(): MissionLoader {
    if (!MissionLoader.instance) {
      MissionLoader.instance = new MissionLoader()
    }
    return MissionLoader.instance
  }

  loadMissions(): StoryMission[] {
    if (this.loaded) {
      return Array.from(this.missions.values())
    }

    try {
      const data = missionsData as MissionCollection

      if (!validateMissionCollection(data)) {
        throw new Error('Invalid mission data structure')
      }

      data.missions.forEach((jsonMission) => {
        const mission = this.convertJSONToMission(jsonMission)
        this.missions.set(mission.id, mission)
      })

      this.loaded = true
      console.log(`✅ Loaded ${this.missions.size} missions from JSON`)

      return Array.from(this.missions.values())
    } catch (error) {
      console.error('Failed to load missions from JSON:', error)
      return []
    }
  }

  private convertJSONToMission(json: JSONMission): StoryMission {
    return {
      id: json.id,
      title: json.title,
      description: json.description,
      unlocked: json.unlocked,
      completed: false,
      objectives: json.objectives.map((obj) => ({
        ...obj,
        current: 0
      })),
      waves: json.waves.map((wave, index) => ({
        id: index + 1,
        enemies: wave.enemies.map((enemy) => ({
          type: enemy.type,
          count: enemy.count,
          pattern: enemy.pattern,
          spawnDelay: enemy.spawnDelay
        })),
        spawnInterval: wave.spawnInterval,
        completed: false
      })),
      dialogue: json.dialogue,
      hasBoss: json.hasBoss,
      bossConfig: json.bossConfig
        ? {
            type: 'BOSS' as const,
            health: json.bossConfig.health,
            phases: [
              {
                healthThreshold: 100,
                pattern: json.bossConfig.pattern,
                attackPattern: 'SPREAD',
                speed: 1.5
              },
              {
                healthThreshold: 50,
                pattern: 'CHASE',
                attackPattern: 'RAPID',
                speed: 2.0
              },
              {
                healthThreshold: 20,
                pattern: 'CIRCLE',
                attackPattern: 'BARRAGE',
                speed: 2.5
              }
            ],
            scoreValue: json.bossConfig.scoreValue
          }
        : undefined
    }
  }

  getMissionById(id: number): StoryMission | undefined {
    if (!this.loaded) {
      this.loadMissions()
    }
    return this.missions.get(id)
  }

  getAllMissions(): StoryMission[] {
    if (!this.loaded) {
      this.loadMissions()
    }
    return Array.from(this.missions.values()).sort((a, b) => a.id - b.id)
  }

  reloadMissions(): StoryMission[] {
    this.missions.clear()
    this.loaded = false
    return this.loadMissions()
  }

  validateMissionFile(jsonString: string): { valid: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonString)

      if (!validateMissionCollection(data)) {
        return { valid: false, error: 'Invalid mission structure' }
      }

      return { valid: true }
    } catch (error) {
      return { valid: false, error: error.message }
    }
  }
}

export const missionLoader = MissionLoader.getInstance()
