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

export type MissionReportParams = {
  missionName: string
  outcome: 'victory' | 'defeat'
  score: number
  enemiesDefeated: number
  damageTaken: number
  previousReports?: string[]
}

export class GeminiApiClient {
  private baseUrl: string

  constructor() {
    // Use environment variable or default
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  }

  async generateMission(params: MissionGenerationParams): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate-mission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate mission')
      }

      const result = await response.json()
      return result.data
    } catch (error: any) {
      console.error('Mission generation error:', error)
      throw new Error(error.message || 'Failed to connect to server')
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
        const error = await response.json()
        throw new Error(error.error || 'Failed to get hint')
      }

      const result = await response.json()
      return result.data.hint
    } catch (error: any) {
      console.error('Tactical hint error:', error)
      throw new Error(error.message || 'Failed to connect to server')
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
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate report')
      }

      const result = await response.json()
      return result.data.report
    } catch (error: any) {
      console.error('Mission report error:', error)
      throw new Error(error.message || 'Failed to connect to server')
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
}

export const geminiApiClient = new GeminiApiClient()
