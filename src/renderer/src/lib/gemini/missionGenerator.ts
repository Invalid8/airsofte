import { geminiClient } from './geminiClient'
import type { StoryMission, EnemyType, MovementPattern } from '../../types/gameTypes'

const MISSION_STORAGE_KEY = 'airsofte_ai_missions'

export type MissionGenerationParams = {
  difficulty: 'Easy' | 'Normal' | 'Hard'
  theme?: string
  waveCount: number
  hasBoss?: boolean
}

type GeneratedMissionData = {
  title: string
  description: string
  objectives: Array<{
    type: string
    target: number
    description: string
  }>
  waves: Array<{
    enemies: Array<{
      type: string
      count: number
      pattern: string
      spawnDelay: number
    }>
  }>
  dialogue: Array<{
    character: string
    text: string
    timing: string
  }>
}

export class MissionGenerator {
  async generateMission(params: MissionGenerationParams): Promise<StoryMission | null> {
    if (!geminiClient.isActive()) {
      console.warn('Gemini is not enabled')
      return null
    }

    const prompt = this.buildPrompt(params)
    const response = await geminiClient.generateContent('mission_generator', prompt, {
      useCache: false,
      temperature: 0.8,
      maxOutputTokens: 2000
    })

    if (!response) return null

    try {
      const cleaned = this.cleanJsonResponse(response)
      const missionData: GeneratedMissionData = JSON.parse(cleaned)
      return this.convertToStoryMission(missionData, params)
    } catch (error) {
      console.error('Failed to parse mission data:', error)
      return null
    }
  }

  private buildPrompt(params: MissionGenerationParams): string {
    return `You are a game mission designer. Generate a space shooter mission with these parameters:

**Parameters:**
- Difficulty: ${params.difficulty}
- Theme: ${params.theme || 'generic space combat'}
- Number of waves: ${params.waveCount}
- Boss encounter: ${params.hasBoss ? 'Yes' : 'No'}

**Enemy Types Available:**
- BASIC: Standard fighters (low health, medium speed)
- SCOUT: Fast, agile units (low health, high speed)
- BOMBER: Heavy armored units (high health, slow speed)
- BOSS: Massive command ship (very high health, variable speed)

**Movement Patterns Available:**
- STRAIGHT: Moves in straight line
- WAVE: Sine wave pattern
- ZIGZAG: Sharp left-right movement
- CIRCLE: Circular pattern
- CHASE: Actively pursues player
- TELEPORT: Teleports randomly

**Objective Types:**
- DESTROY: Destroy X enemies
- SURVIVE: Survive for X milliseconds
- COLLECT: Collect X power-ups

**Requirements:**
1. Generate an exciting mission title (2-4 words)
2. Write a brief description (1-2 sentences)
3. Create ${params.waveCount} waves with enemy compositions
4. Add 2-3 mission objectives
5. Include commander dialogue at START, MID, and END

**IMPORTANT:** Return ONLY valid JSON in this exact format, no markdown, no extra text:

{
  "title": "Mission Title",
  "description": "Brief mission description",
  "objectives": [
    { "type": "DESTROY", "target": 20, "description": "Destroy 20 enemies" },
    { "type": "SURVIVE", "target": 90000, "description": "Survive for 90 seconds" }
  ],
  "waves": [
    {
      "enemies": [
        { "type": "BASIC", "count": 5, "pattern": "STRAIGHT", "spawnDelay": 500 },
        { "type": "SCOUT", "count": 3, "pattern": "ZIGZAG", "spawnDelay": 700 }
      ]
    }
  ],
  "dialogue": [
    { "character": "Commander", "text": "Mission briefing text", "timing": "START" },
    { "character": "Commander", "text": "Mid-mission update", "timing": "MID" },
    { "character": "Commander", "text": "Mission complete!", "timing": "END" }
  ]
}

Generate the mission now:`
  }

  private cleanJsonResponse(response: string): string {
    let cleaned = response.trim()

    cleaned = cleaned.replace(/```json\n?/g, '')
    cleaned = cleaned.replace(/```\n?/g, '')

    const jsonStart = cleaned.indexOf('{')
    const jsonEnd = cleaned.lastIndexOf('}')

    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1)
    }

    return cleaned
  }

  private convertToStoryMission(
    data: GeneratedMissionData,
    params: MissionGenerationParams
  ): StoryMission {
    const aiMissions = this.getAIMissions()
    const nextId = 1000 + aiMissions.length

    return {
      id: nextId,
      title: data.title,
      description: data.description,
      unlocked: true,
      completed: false,
      stars: 0,
      objectives: data.objectives.map((obj) => ({
        type: obj.type as any,
        target: obj.target,
        current: 0,
        description: obj.description
      })),
      waves: data.waves.map((wave, index) => ({
        id: index + 1,
        enemies: wave.enemies.map((enemy) => ({
          type: this.validateEnemyType(enemy.type),
          count: Math.max(1, Math.min(20, enemy.count)),
          pattern: this.validatePattern(enemy.pattern),
          spawnDelay: Math.max(300, Math.min(2000, enemy.spawnDelay))
        })),
        spawnInterval: 1000,
        completed: false
      })),
      dialogue: data.dialogue?.map((d) => ({
        character: d.character,
        text: d.text,
        timing: this.validateTiming(d.timing)
      })),
      hasBoss: params.hasBoss || false
    }
  }

  private validateEnemyType(type: string): EnemyType {
    const valid: EnemyType[] = ['BASIC', 'SCOUT', 'BOMBER', 'BOSS']
    return valid.includes(type as EnemyType) ? (type as EnemyType) : 'BASIC'
  }

  private validatePattern(pattern: string): MovementPattern {
    const valid: MovementPattern[] = ['STRAIGHT', 'WAVE', 'ZIGZAG', 'CIRCLE', 'CHASE', 'TELEPORT']
    return valid.includes(pattern as MovementPattern) ? (pattern as MovementPattern) : 'STRAIGHT'
  }

  private validateTiming(timing: string): 'START' | 'MID' | 'END' {
    const valid = ['START', 'MID', 'END']
    return valid.includes(timing) ? (timing as 'START' | 'MID' | 'END') : 'START'
  }

  saveMission(mission: StoryMission): void {
    const missions = this.getAIMissions()
    missions.push(mission)
    localStorage.setItem(MISSION_STORAGE_KEY, JSON.stringify(missions))
  }

  getAIMissions(): StoryMission[] {
    try {
      const stored = localStorage.getItem(MISSION_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  deleteMission(missionId: number): void {
    const missions = this.getAIMissions()
    const filtered = missions.filter((m) => m.id !== missionId)
    localStorage.setItem(MISSION_STORAGE_KEY, JSON.stringify(filtered))
  }

  clearAllAIMissions(): void {
    localStorage.removeItem(MISSION_STORAGE_KEY)
  }
}

export const missionGenerator = new MissionGenerator()
