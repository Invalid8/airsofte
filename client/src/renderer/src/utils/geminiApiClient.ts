export type MissionGenerationParams = {
  difficulty: 'Easy' | 'Normal' | 'Hard'
  theme?: string
  waveCount: number
}

export type TacticalHintParams = {
  playerHealth: number
  enemyTypes: string[]
  playerWeapon: string
  waveNumber: number
}

export type EnhancedTacticalHintParams = {
  playerHealth: number
  enemyTypes: string[]
  playerWeapon: string
  waveNumber: number
  comboMultiplier?: number
  activePowerUps?: string[]
  sessionId: string
}

export type GameCommentaryParams = {
  eventType:
    | 'COMBO'
    | 'NEAR_DEATH'
    | 'BOSS_SPAWN'
    | 'BOSS_DEFEAT'
    | 'EPIC_KILL'
    | 'WAVE_COMPLETE'
    | 'POWER_UP'
    | 'PERFECT_WAVE'
  context: {
    playerHealth?: number
    comboMultiplier?: number
    enemiesDefeated?: number
    bossName?: string
    waveNumber?: number
    powerUpType?: string
    streak?: number
  }
  sessionId: string
}

export type MissionReportParams = {
  missionName: string
  outcome: 'victory' | 'defeat'
  score: number
  enemiesDefeated: number
  damageTaken: number
  previousReports?: string[]
}

type ApiErrorResponse = {
  error?: string
  message?: string
}

type MissionGenerationResponse = {
  data: unknown
}

type TacticalHintResponse = {
  data: {
    hint: string
  }
}

type MissionReportResponse = {
  data: {
    report: string
  }
}

export class GeminiApiClient {
  private baseUrl: string

  constructor() {
    // Use environment variable or default
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  }

  async generateMission(params: MissionGenerationParams): Promise<unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate-mission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        const error = (await response.json()) as ApiErrorResponse
        throw new Error(error.error || 'Failed to generate mission')
      }

      const result = (await response.json()) as MissionGenerationResponse
      return result.data
    } catch (error) {
      console.error('Mission generation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to server'
      throw new Error(errorMessage)
    }
  }

  async getTacticalHint(params: TacticalHintParams): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tactical-hint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        const error = (await response.json()) as ApiErrorResponse
        throw new Error(error.error || 'Failed to get hint')
      }

      const result = (await response.json()) as TacticalHintResponse
      return result.data.hint
    } catch (error) {
      console.error('Tactical hint error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to server'
      throw new Error(errorMessage)
    }
  }

  async getEnhancedTacticalHint(params: EnhancedTacticalHintParams): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tactical-hint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        const error = (await response.json()) as ApiErrorResponse
        throw new Error(error.error || 'Failed to get hint')
      }

      const result = (await response.json()) as TacticalHintResponse
      return result.data.hint
    } catch (error) {
      console.error('Enhanced tactical hint error:', error)
      return ''
    }
  }

  async getGameCommentary(params: GameCommentaryParams): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/commentary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        const error = (await response.json()) as ApiErrorResponse
        throw new Error(error.error || 'Failed to get commentary')
      }

      const result = (await response.json()) as {
        data: { commentary: string; throttled?: boolean }
      }
      return result.data.throttled ? '' : result.data.commentary
    } catch (error) {
      console.error('Game commentary error:', error)
      return ''
    }
  }

  async generateMissionReport(params: MissionReportParams): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/mission-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        const error = (await response.json()) as ApiErrorResponse
        throw new Error(error.error || 'Failed to generate report')
      }

      const result = (await response.json()) as MissionReportResponse
      return result.data.report
    } catch (error) {
      console.error('Mission report error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to server'
      throw new Error(errorMessage)
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      return response.ok
    } catch {
      return false
    }
  }

  async cleanupSession(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/session/${sessionId}`, {
        method: 'DELETE'
      })
      return response.ok
    } catch (error) {
      console.error('Session cleanup error:', error)
      return false
    }
  }
}

export const geminiApiClient = new GeminiApiClient()
