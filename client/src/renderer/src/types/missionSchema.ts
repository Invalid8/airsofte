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

function isValidObjective(obj: unknown): obj is JSONMissionObjective {
  if (typeof obj !== 'object' || obj === null) return false
  const candidate = obj as Record<string, unknown>

  return (
    typeof candidate.type === 'string' &&
    typeof candidate.target === 'number' &&
    typeof candidate.description === 'string'
  )
}

function isValidWaveEnemy(enemy: unknown): enemy is JSONWaveEnemy {
  if (typeof enemy !== 'object' || enemy === null) return false
  const candidate = enemy as Record<string, unknown>

  return (
    typeof candidate.type === 'string' &&
    typeof candidate.count === 'number' &&
    typeof candidate.pattern === 'string' &&
    typeof candidate.spawnDelay === 'number'
  )
}

function isValidWave(wave: unknown): wave is JSONWave {
  if (typeof wave !== 'object' || wave === null) return false
  const candidate = wave as Record<string, unknown>

  return (
    Array.isArray(candidate.enemies) &&
    candidate.enemies.every(isValidWaveEnemy) &&
    typeof candidate.spawnInterval === 'number'
  )
}

export function validateMission(mission: unknown): mission is JSONMission {
  if (typeof mission !== 'object' || mission === null) return false
  const candidate = mission as Record<string, unknown>

  if (typeof candidate.id !== 'number') return false
  if (typeof candidate.title !== 'string') return false
  if (typeof candidate.description !== 'string') return false
  if (typeof candidate.unlocked !== 'boolean') return false
  if (!Array.isArray(candidate.objectives)) return false
  if (!Array.isArray(candidate.waves)) return false
  if (typeof candidate.hasBoss !== 'boolean') return false

  if (!candidate.objectives.every(isValidObjective)) return false
  if (!candidate.waves.every(isValidWave)) return false

  return true
}

export function validateMissionCollection(data: unknown): data is MissionCollection {
  if (typeof data !== 'object' || data === null) return false
  const candidate = data as Record<string, unknown>

  if (typeof candidate.version !== 'string') return false
  if (typeof candidate.lastUpdated !== 'string') return false
  if (!Array.isArray(candidate.missions)) return false

  return candidate.missions.every(validateMission)
}
