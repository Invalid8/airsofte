import type {
  SaveGame,
  HighScore,
  GameSettings,
  StoryMission,
  WeaponType
} from '../types/gameTypes'
import { DEFAULT_KEY_BINDINGS } from '../config/gameConstants'

const STORAGE_KEYS = {
  SAVE_GAME: 'airsofte_save_game',
  HIGH_SCORES: 'airsofte_high_scores',
  SETTINGS: 'airsofte_settings',
  PLAYER_PROGRESS: 'airsofte_progress'
}

export class StorageManager {
  private static isLocalStorageAvailable(): boolean {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  static get<T>(key: string, defaultValue: T): T {
    if (!this.isLocalStorageAvailable()) return defaultValue

    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  }

  static set<T>(key: string, value: T): boolean {
    if (!this.isLocalStorageAvailable()) return false

    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  }

  private static remove(key: string): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.removeItem(key)
    }
  }

  static getSettings(): GameSettings {
    return this.get(STORAGE_KEYS.SETTINGS, {
      volume: {
        master: 1.0,
        music: 0.8,
        sfx: 0.5
      },
      difficulty: 'Normal',
      keyBindings: DEFAULT_KEY_BINDINGS,
      graphics: {
        particles: true,
        screenShake: true,
        showFPS: false
      }
    })
  }

  static saveSettings(settings: GameSettings): boolean {
    return this.set(STORAGE_KEYS.SETTINGS, settings)
  }

  static getUserHighScoresKey(userId: string): string {
    return `${STORAGE_KEYS.HIGH_SCORES}_${userId}`
  }

  static getHighScores(userId?: string): { quickPlay: HighScore[]; storyMode: HighScore[] } {
    const key = userId ? this.getUserHighScoresKey(userId) : STORAGE_KEYS.HIGH_SCORES

    return this.get(key, {
      quickPlay: [],
      storyMode: []
    })
  }

  static addHighScore(score: HighScore, userId?: string): boolean {
    const key = userId ? this.getUserHighScoresKey(userId) : STORAGE_KEYS.HIGH_SCORES
    const scores = this.get<{ quickPlay: HighScore[]; storyMode: HighScore[] }>(key, {
      quickPlay: [],
      storyMode: []
    })

    const list = score.mode === 'QUICK_PLAY' ? scores.quickPlay : scores.storyMode

    const timestamp = Date.now()
    const uniqueId = `${score.name}_${timestamp}`

    const scoreWithId = {
      ...score,
      name: score.name,
      id: uniqueId,
      date: timestamp
    }

    list.push(scoreWithId as any)
    list.sort((a, b) => b.score - a.score)

    if (list.length > 20) {
      list.length = 20
    }

    return this.set(key, scores)
  }

  static clearHighScores(mode?: 'QUICK_PLAY' | 'STORY_MODE', userId?: string): boolean {
    const key = userId ? this.getUserHighScoresKey(userId) : STORAGE_KEYS.HIGH_SCORES
    const scores = this.get<{ quickPlay: HighScore[]; storyMode: HighScore[] }>(key, {
      quickPlay: [],
      storyMode: []
    })

    if (mode) {
      if (mode === 'QUICK_PLAY') {
        scores.quickPlay = []
      } else {
        scores.storyMode = []
      }
    } else {
      scores.quickPlay = []
      scores.storyMode = []
    }

    return this.set(key, scores)
  }

  static isHighScore(score: number, mode: 'QUICK_PLAY' | 'STORY_MODE', userId?: string): boolean {
    const scores = this.getHighScores(userId)
    const list = mode === 'QUICK_PLAY' ? scores.quickPlay : scores.storyMode

    if (list.length < 20) return true
    return score > list[list.length - 1].score
  }

  static getPlayerProgress(): {
    storyMissions: StoryMission[]
    unlockedWeapons: WeaponType[]
    totalScore: number
    achievements: string[]
  } {
    return this.get(STORAGE_KEYS.PLAYER_PROGRESS, {
      storyMissions: [],
      unlockedWeapons: ['SINGLE'],
      totalScore: 0,
      achievements: []
    })
  }

  static savePlayerProgress(progress: {
    storyMissions: StoryMission[]
    unlockedWeapons: WeaponType[]
    totalScore: number
    achievements: string[]
  }): boolean {
    return this.set(STORAGE_KEYS.PLAYER_PROGRESS, progress)
  }

  static unlockMission(missionId: number): boolean {
    const progress = this.getPlayerProgress()
    const mission = progress.storyMissions.find((m) => m.id === missionId)

    if (mission) {
      mission.unlocked = true
      return this.savePlayerProgress(progress)
    }

    return false
  }

  static completeMission(missionId: number): boolean {
    const progress = this.getPlayerProgress()
    const mission = progress.storyMissions.find((m) => m.id === missionId)

    if (mission) {
      mission.completed = true

      const nextMission = progress.storyMissions.find((m) => m.id === missionId + 1)
      if (nextMission) {
        nextMission.unlocked = true
      }

      return this.savePlayerProgress(progress)
    }

    return false
  }

  static unlockWeapon(weapon: WeaponType): boolean {
    const progress = this.getPlayerProgress()

    if (!progress.unlockedWeapons.includes(weapon)) {
      progress.unlockedWeapons.push(weapon)
      return this.savePlayerProgress(progress)
    }

    return false
  }

  static getSaveGame(): SaveGame | null {
    return this.get<SaveGame | null>(STORAGE_KEYS.SAVE_GAME, null)
  }

  static saveGame(saveData: SaveGame): boolean {
    saveData.lastPlayed = Date.now()
    return this.set(STORAGE_KEYS.SAVE_GAME, saveData)
  }

  static deleteSaveGame(): void {
    this.remove(STORAGE_KEYS.SAVE_GAME)
  }

  static resetAllData(): void {
    Object.values(STORAGE_KEYS).forEach((key) => this.remove(key))
  }

  static exportData(): string {
    const data = {
      settings: this.getSettings(),
      highScores: this.getHighScores(),
      progress: this.getPlayerProgress(),
      saveGame: this.getSaveGame()
    }
    return JSON.stringify(data, null, 2)
  }

  static importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString)

      if (data.settings) this.saveSettings(data.settings)
      if (data.highScores) this.set(STORAGE_KEYS.HIGH_SCORES, data.highScores)
      if (data.progress) this.savePlayerProgress(data.progress)
      if (data.saveGame) this.saveGame(data.saveGame)

      return true
    } catch {
      return false
    }
  }
}
