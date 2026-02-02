import type { StoryMission, EnemyType, MovementPattern } from '../types/gameTypes'

type DialogueTiming = 'START' | 'MID' | 'END'

type WaveBuilder = {
  enemyType: EnemyType
  count: number
  pattern?: MovementPattern
  spawnDelay?: number
}

type ObjectiveBuilder = {
  type: 'DESTROY' | 'SURVIVE' | 'PROTECT' | 'COLLECT'
  target: number
  description: string
}

export class StoryBuilder {
  private mission: Partial<StoryMission> = {}
  private currentId: number = 1

  constructor(id: number) {
    this.currentId = id
    this.mission = {
      id,
      unlocked: id === 1,
      completed: false,
      waves: [],
      objectives: [],
      dialogue: [],
      hasBoss: false
    }
  }

  title(title: string): this {
    this.mission.title = title
    return this
  }

  description(description: string): this {
    this.mission.description = description
    return this
  }

  objective(objective: ObjectiveBuilder): this {
    if (!this.mission.objectives) this.mission.objectives = []
    this.mission.objectives.push({
      ...objective,
      current: 0
    })
    return this
  }

  wave(config: WaveBuilder | WaveBuilder[]): this {
    if (!this.mission.waves) this.mission.waves = []

    const waveId = this.mission.waves.length + 1
    const enemies = Array.isArray(config) ? config : [config]

    this.mission.waves.push({
      id: waveId,
      enemies: enemies.map((e) => ({
        type: e.enemyType,
        count: e.count,
        pattern: e.pattern || 'STRAIGHT',
        spawnDelay: e.spawnDelay || 500
      })),
      spawnInterval: 1000,
      completed: false
    })

    return this
  }

  dialogue(character: string, text: string, timing: DialogueTiming = 'START'): this {
    if (!this.mission.dialogue) this.mission.dialogue = []
    this.mission.dialogue.push({ character, text, timing })
    return this
  }

  boss(config?: { health?: number; pattern?: MovementPattern; scoreValue?: number }): this {
    this.mission.hasBoss = true

    if (!this.mission.waves) this.mission.waves = []

    const bossWaveId = this.mission.waves.length + 1
    this.mission.waves.push({
      id: bossWaveId,
      enemies: [
        {
          type: 'BOSS',
          count: 1,
          pattern: config?.pattern || 'CIRCLE',
          spawnDelay: 0
        }
      ],
      spawnInterval: 2000,
      completed: false
    })

    if (config) {
      this.mission.bossConfig = {
        type: 'BOSS',
        health: config.health || 2000,
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
        scoreValue: config.scoreValue || 5000
      }
    }

    return this
  }

  build(): StoryMission {
    if (!this.mission.title || !this.mission.description) {
      throw new Error('Mission must have a title and description')
    }

    if (!this.mission.waves || this.mission.waves.length === 0) {
      throw new Error('Mission must have at least one wave')
    }

    if (!this.mission.objectives || this.mission.objectives.length === 0) {
      throw new Error('Mission must have at least one objective')
    }

    return this.mission as StoryMission
  }
}

export function createMission(id: number): StoryBuilder {
  return new StoryBuilder(id)
}

export const MissionTemplates = {
  tutorialMission: (id: number) =>
    createMission(id)
      .title('First Contact')
      .description('Learn the basics of combat and survive your first encounter.')
      .objective({
        type: 'DESTROY',
        target: 10,
        description: 'Destroy 10 enemy fighters'
      })
      .objective({
        type: 'SURVIVE',
        target: 60000,
        description: 'Survive for 1 minute'
      })
      .wave({ enemyType: 'BASIC', count: 5, pattern: 'STRAIGHT' })
      .wave({ enemyType: 'BASIC', count: 5, pattern: 'WAVE' })
      .dialogue('Commander', 'Welcome, pilot. Stay focused and follow your training.', 'START')
      .dialogue('Commander', 'Good work! Stay alert, more are coming.', 'MID')
      .dialogue('Commander', 'Excellent! Mission complete.', 'END')
      .build(),

  swarmMission: (id: number) =>
    createMission(id)
      .title('The Swarm')
      .description('Face increased enemy numbers and learn to manage multiple threats.')
      .objective({
        type: 'DESTROY',
        target: 20,
        description: 'Destroy 20 enemies'
      })
      .objective({
        type: 'COLLECT',
        target: 3,
        description: 'Collect 3 power-ups'
      })
      .wave([
        { enemyType: 'BASIC', count: 8, pattern: 'STRAIGHT' },
        { enemyType: 'SCOUT', count: 3, pattern: 'ZIGZAG' }
      ])
      .wave([
        { enemyType: 'SCOUT', count: 6, pattern: 'WAVE' },
        { enemyType: 'BASIC', count: 4, pattern: 'STRAIGHT' }
      ])
      .dialogue('Commander', 'Heavy enemy activity detected. Expect resistance.', 'START')
      .dialogue('Commander', 'Collect power-ups! They could save your life.', 'MID')
      .dialogue('Commander', 'Outstanding! Enemy swarm neutralized.', 'END')
      .build(),

  bomberMission: (id: number) =>
    createMission(id)
      .title('Heavy Artillery')
      .description('Encounter heavily armored bombers for the first time.')
      .objective({
        type: 'DESTROY',
        target: 5,
        description: 'Destroy 5 bomber units'
      })
      .objective({
        type: 'SURVIVE',
        target: 90000,
        description: 'Survive for 1 minute 30 seconds'
      })
      .wave([
        { enemyType: 'BOMBER', count: 2, pattern: 'STRAIGHT', spawnDelay: 1200 },
        { enemyType: 'SCOUT', count: 4, pattern: 'CIRCLE' }
      ])
      .wave([
        { enemyType: 'BOMBER', count: 3, pattern: 'WAVE', spawnDelay: 1000 },
        { enemyType: 'BASIC', count: 5, pattern: 'STRAIGHT' }
      ])
      .dialogue('Commander', 'Heavy bomber units detected. Focus fire and stay mobile.', 'START')
      .dialogue('Commander', 'These bombers are tough but slow. Use that to your advantage!', 'MID')
      .dialogue('Commander', 'Mission success! Enemy bombers eliminated.', 'END')
      .build(),

  defenseMission: (id: number) =>
    createMission(id)
      .title('Defensive Position')
      .description('Hold the line against waves of mixed enemy forces.')
      .objective({
        type: 'DESTROY',
        target: 30,
        description: 'Destroy 30 enemies'
      })
      .objective({
        type: 'SURVIVE',
        target: 120000,
        description: 'Survive for 2 minutes'
      })
      .wave([
        { enemyType: 'BASIC', count: 6, pattern: 'WAVE' },
        { enemyType: 'SCOUT', count: 4, pattern: 'ZIGZAG' }
      ])
      .wave([
        { enemyType: 'BOMBER', count: 2, pattern: 'STRAIGHT', spawnDelay: 1000 },
        { enemyType: 'SCOUT', count: 6, pattern: 'CIRCLE' }
      ])
      .wave([
        { enemyType: 'BASIC', count: 8, pattern: 'STRAIGHT' },
        { enemyType: 'BOMBER', count: 2, pattern: 'WAVE', spawnDelay: 1000 },
        { enemyType: 'SCOUT', count: 5, pattern: 'ZIGZAG' }
      ])
      .dialogue('Commander', 'This is it. We need you to hold this position at all costs.', 'START')
      .dialogue('Commander', 'More waves incoming! Stay sharp!', 'MID')
      .dialogue('Commander', 'Position secured! Your defense was exemplary.', 'END')
      .build(),

  bossMission: (id: number) =>
    createMission(id)
      .title('The Guardian')
      .description('Face your first boss encounter. Victory requires skill and strategy.')
      .objective({
        type: 'DESTROY',
        target: 1,
        description: 'Defeat the Guardian Boss'
      })
      .wave([
        { enemyType: 'BASIC', count: 5, pattern: 'WAVE' },
        { enemyType: 'SCOUT', count: 3, pattern: 'CIRCLE' }
      ])
      .boss({
        health: 2000,
        pattern: 'CIRCLE',
        scoreValue: 3000
      })
      .dialogue('Commander', 'Massive energy signature detected. Prepare yourself!', 'START')
      .dialogue('Commander', 'That is their command ship! Take it down!', 'MID')
      .dialogue('Commander', 'Incredible! The Guardian has been destroyed!', 'END')
      .build()
}

export const QuickMissionBuilder = {
  create: (
    id: number,
    config: {
      title: string
      description: string
      waves: number
      difficulty: 'easy' | 'medium' | 'hard'
      hasBoss?: boolean
    }
  ) => {
    const builder = createMission(id).title(config.title).description(config.description)

    const enemyCount = config.difficulty === 'easy' ? 5 : config.difficulty === 'medium' ? 8 : 12

    builder.objective({
      type: 'DESTROY',
      target: enemyCount * config.waves,
      description: `Destroy ${enemyCount * config.waves} enemies`
    })

    for (let i = 0; i < config.waves; i++) {
      if (i === 0) {
        builder.wave({ enemyType: 'BASIC', count: enemyCount, pattern: 'STRAIGHT' })
      } else if (i === 1) {
        builder.wave([
          { enemyType: 'BASIC', count: enemyCount - 2, pattern: 'WAVE' },
          { enemyType: 'SCOUT', count: 2, pattern: 'ZIGZAG' }
        ])
      } else {
        builder.wave([
          { enemyType: 'BOMBER', count: 1, pattern: 'STRAIGHT', spawnDelay: 1200 },
          { enemyType: 'SCOUT', count: Math.floor(enemyCount / 2), pattern: 'CIRCLE' },
          { enemyType: 'BASIC', count: Math.floor(enemyCount / 2), pattern: 'WAVE' }
        ])
      }
    }

    if (config.hasBoss) {
      builder.boss()
    }

    builder
      .dialogue('Commander', `Mission ${id}: ${config.title}. Good luck, pilot.`, 'START')
      .dialogue('Commander', 'Keep fighting! You are doing well.', 'MID')
      .dialogue('Commander', 'Mission accomplished! Return to base.', 'END')

    return builder.build()
  }
}
