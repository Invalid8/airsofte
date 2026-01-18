import type { StoryMission } from '../types/gameTypes'

export const STORY_MISSIONS: StoryMission[] = [
  {
    id: 1,
    title: 'First Contact',
    description: 'Learn the basics of combat and survive your first encounter.',
    unlocked: true,
    completed: false,
    objectives: [
      {
        type: 'DESTROY',
        target: 10,
        current: 0,
        description: 'Destroy 10 enemy fighters'
      },
      {
        type: 'SURVIVE',
        target: 60000,
        current: 0,
        description: 'Survive for 1 minute'
      }
    ],
    waves: [
      {
        id: 1,
        enemies: [{ type: 'BASIC', count: 5, spawnDelay: 800, pattern: 'STRAIGHT' }],
        spawnInterval: 1000,
        completed: false
      },
      {
        id: 2,
        enemies: [{ type: 'BASIC', count: 5, spawnDelay: 600, pattern: 'WAVE' }],
        spawnInterval: 1000,
        completed: false
      }
    ],
    dialogue: [
      {
        character: 'Commander',
        text: 'Welcome, pilot. This is your first mission. Stay focused and follow your training.',
        timing: 'START'
      },
      {
        character: 'Commander',
        text: 'Good work! You handled that wave well. Stay alert, more are coming.',
        timing: 'MID'
      },
      {
        character: 'Commander',
        text: 'Excellent! Mission complete. You are ready for more challenging assignments.',
        timing: 'END'
      }
    ],
    hasBoss: false
  },
  {
    id: 2,
    title: 'The Swarm',
    description: 'Face increased enemy numbers and learn to manage multiple threats.',
    unlocked: false,
    completed: false,
    objectives: [
      {
        type: 'DESTROY',
        target: 20,
        current: 0,
        description: 'Destroy 20 enemies'
      },
      {
        type: 'COLLECT',
        target: 3,
        current: 0,
        description: 'Collect 3 power-ups'
      }
    ],
    waves: [
      {
        id: 1,
        enemies: [
          { type: 'BASIC', count: 8, spawnDelay: 500, pattern: 'STRAIGHT' },
          { type: 'SCOUT', count: 3, spawnDelay: 700, pattern: 'ZIGZAG' }
        ],
        spawnInterval: 1000,
        completed: false
      },
      {
        id: 2,
        enemies: [
          { type: 'SCOUT', count: 6, spawnDelay: 400, pattern: 'WAVE' },
          { type: 'BASIC', count: 4, spawnDelay: 600, pattern: 'STRAIGHT' }
        ],
        spawnInterval: 1000,
        completed: false
      }
    ],
    dialogue: [
      {
        character: 'Commander',
        text: 'Intelligence reports heavy enemy activity in this sector. Expect resistance.',
        timing: 'START'
      },
      {
        character: 'Commander',
        text: 'Do not forget to collect power-ups! They could save your life.',
        timing: 'MID'
      },
      {
        character: 'Commander',
        text: 'Outstanding performance. The enemy swarm has been neutralized.',
        timing: 'END'
      }
    ],
    hasBoss: false
  },
  {
    id: 3,
    title: 'Heavy Artillery',
    description: 'Encounter heavily armored bombers for the first time.',
    unlocked: false,
    completed: false,
    objectives: [
      {
        type: 'DESTROY',
        target: 5,
        current: 0,
        description: 'Destroy 5 bomber units'
      },
      {
        type: 'SURVIVE',
        target: 90000,
        current: 0,
        description: 'Survive for 1 minute 30 seconds'
      }
    ],
    waves: [
      {
        id: 1,
        enemies: [
          { type: 'BOMBER', count: 2, spawnDelay: 1200, pattern: 'STRAIGHT' },
          { type: 'SCOUT', count: 4, spawnDelay: 500, pattern: 'CIRCLE' }
        ],
        spawnInterval: 1500,
        completed: false
      },
      {
        id: 2,
        enemies: [
          { type: 'BOMBER', count: 3, spawnDelay: 1000, pattern: 'WAVE' },
          { type: 'BASIC', count: 5, spawnDelay: 600, pattern: 'STRAIGHT' }
        ],
        spawnInterval: 1500,
        completed: false
      }
    ],
    dialogue: [
      {
        character: 'Commander',
        text: 'Radar shows heavy bomber units in your path. Focus fire and stay mobile.',
        timing: 'START'
      },
      {
        character: 'Commander',
        text: 'These bombers are tough but slow. Use that to your advantage!',
        timing: 'MID'
      },
      {
        character: 'Commander',
        text: 'Mission success! Enemy bombers eliminated. Well done, pilot.',
        timing: 'END'
      }
    ],
    hasBoss: false
  },
  {
    id: 4,
    title: 'Defensive Position',
    description: 'Hold the line against waves of mixed enemy forces.',
    unlocked: false,
    completed: false,
    objectives: [
      {
        type: 'DESTROY',
        target: 30,
        current: 0,
        description: 'Destroy 30 enemies'
      },
      {
        type: 'SURVIVE',
        target: 120000,
        current: 0,
        description: 'Survive for 2 minutes'
      }
    ],
    waves: [
      {
        id: 1,
        enemies: [
          { type: 'BASIC', count: 6, spawnDelay: 500, pattern: 'WAVE' },
          { type: 'SCOUT', count: 4, spawnDelay: 400, pattern: 'ZIGZAG' }
        ],
        spawnInterval: 1000,
        completed: false
      },
      {
        id: 2,
        enemies: [
          { type: 'BOMBER', count: 2, spawnDelay: 1000, pattern: 'STRAIGHT' },
          { type: 'SCOUT', count: 6, spawnDelay: 400, pattern: 'CIRCLE' }
        ],
        spawnInterval: 1200,
        completed: false
      },
      {
        id: 3,
        enemies: [
          { type: 'BASIC', count: 8, spawnDelay: 500, pattern: 'STRAIGHT' },
          { type: 'BOMBER', count: 2, spawnDelay: 1000, pattern: 'WAVE' },
          { type: 'SCOUT', count: 5, spawnDelay: 400, pattern: 'ZIGZAG' }
        ],
        spawnInterval: 1000,
        completed: false
      }
    ],
    dialogue: [
      {
        character: 'Commander',
        text: 'This is it, pilot. We need you to hold this position at all costs.',
        timing: 'START'
      },
      {
        character: 'Commander',
        text: 'More waves incoming! Stay sharp and keep firing!',
        timing: 'MID'
      },
      {
        character: 'Commander',
        text: 'Position secured! Your defense was exemplary, pilot.',
        timing: 'END'
      }
    ],
    hasBoss: false
  },
  {
    id: 5,
    title: 'The Guardian',
    description: 'Face your first boss encounter. Victory requires skill and strategy.',
    unlocked: false,
    completed: false,
    objectives: [
      {
        type: 'DESTROY',
        target: 1,
        current: 0,
        description: 'Defeat the Guardian Boss'
      }
    ],
    waves: [
      {
        id: 1,
        enemies: [
          { type: 'BASIC', count: 5, spawnDelay: 500, pattern: 'WAVE' },
          { type: 'SCOUT', count: 3, spawnDelay: 400, pattern: 'CIRCLE' }
        ],
        spawnInterval: 1000,
        completed: false
      },
      {
        id: 2,
        enemies: [{ type: 'BOSS', count: 1, spawnDelay: 0, pattern: 'CIRCLE' }],
        spawnInterval: 2000,
        completed: false
      }
    ],
    dialogue: [
      {
        character: 'Commander',
        text: 'Long-range scanners are detecting a massive energy signature. Prepare yourself!',
        timing: 'START'
      },
      {
        character: 'Commander',
        text: 'That is their command ship! Take it down and this sector is ours!',
        timing: 'MID'
      },
      {
        character: 'Commander',
        text: 'Incredible! The Guardian has been destroyed! You are a true ace, pilot!',
        timing: 'END'
      }
    ],
    hasBoss: true,
    bossConfig: {
      type: 'BOSS',
      health: 1000,
      phases: [
        {
          healthThreshold: 100,
          pattern: 'CIRCLE',
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
      scoreValue: 5000
    }
  }
]

export class StoryMissionManager {
  private missions: StoryMission[] = []

  constructor() {
    this.loadMissions()
  }

  private loadMissions(): void {
    this.missions = STORY_MISSIONS.map((m) => ({ ...m }))
  }

  getMissions(): StoryMission[] {
    return this.missions
  }

  getMissionById(id: number): StoryMission | undefined {
    return this.missions.find((m) => m.id === id)
  }

  getUnlockedMissions(): StoryMission[] {
    return this.missions.filter((m) => m.unlocked)
  }

  unlockMission(id: number): void {
    const mission = this.getMissionById(id)
    if (mission) {
      mission.unlocked = true
    }
  }

  completeMission(id: number): void {
    const mission = this.getMissionById(id)
    if (mission) {
      mission.completed = true

      const nextMission = this.getMissionById(id + 1)
      if (nextMission) {
        nextMission.unlocked = true
      }
    }
  }

  updateObjective(missionId: number, objectiveIndex: number, progress: number): void {
    const mission = this.getMissionById(missionId)
    if (mission && mission.objectives[objectiveIndex]) {
      mission.objectives[objectiveIndex].current = Math.min(
        progress,
        mission.objectives[objectiveIndex].target
      )
    }
  }

  checkObjectivesComplete(missionId: number): boolean {
    const mission = this.getMissionById(missionId)
    if (!mission) return false

    return mission.objectives.every((obj) => obj.current >= obj.target)
  }

  resetMission(id: number): void {
    const mission = this.getMissionById(id)
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
}

export const storyMissionManager = new StoryMissionManager()
