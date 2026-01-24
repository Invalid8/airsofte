import type { EnemyType, MovementPattern } from './gameTypes'

export type MissionObjectiveType =
  | 'DESTROY'
  | 'SURVIVE'
  | 'PROTECT'
  | 'COLLECT'
  | 'NO_DAMAGE'
  | 'COMBO'

export type DialogueTiming = 'START' | 'MID' | 'END'

export type JSONMissionObjective = {
  type: MissionObjectiveType
  target: number
  description: string
}

export type JSONWaveEnemy = {
  type: EnemyType
  count: number
  pattern: MovementPattern
  spawnDelay: number
}

export type JSONWave = {
  enemies: JSONWaveEnemy[]
  spawnInterval: number
}

export type JSONDialogue = {
  character: string
  text: string
  timing: DialogueTiming
}

export type JSONMissionRewards = {
  scoreMultiplier: number
  unlockWeapon?: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'SPREAD'
  bonusPoints?: number
}

export type JSONBossConfig = {
  health: number
  pattern: MovementPattern
  scoreValue: number
}

export type JSONMission = {
  id: number
  title: string
  description: string
  unlocked: boolean
  objectives: JSONMissionObjective[]
  waves: JSONWave[]
  dialogue?: JSONDialogue[]
  hasBoss: boolean
  bossConfig?: JSONBossConfig
  rewards?: JSONMissionRewards
  difficulty?: 'Easy' | 'Normal' | 'Hard'
}

export type MissionCollection = {
  version: string
  lastUpdated: string
  missions: JSONMission[]
}

export function validateMission(mission: any): mission is JSONMission {
  if (typeof mission.id !== 'number') return false
  if (typeof mission.title !== 'string') return false
  if (typeof mission.description !== 'string') return false
  if (typeof mission.unlocked !== 'boolean') return false
  if (!Array.isArray(mission.objectives)) return false
  if (!Array.isArray(mission.waves)) return false
  if (typeof mission.hasBoss !== 'boolean') return false

  if (
    !mission.objectives.every(
      (obj) =>
        typeof obj.type === 'string' &&
        typeof obj.target === 'number' &&
        typeof obj.description === 'string'
    )
  )
    return false

  if (
    !mission.waves.every(
      (wave) => Array.isArray(wave.enemies) && typeof wave.spawnInterval === 'number'
    )
  )
    return false

  return true
}

export function validateMissionCollection(data: any): data is MissionCollection {
  if (typeof data.version !== 'string') return false
  if (typeof data.lastUpdated !== 'string') return false
  if (!Array.isArray(data.missions)) return false

  return data.missions.every(validateMission)
}
