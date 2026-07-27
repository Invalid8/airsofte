import type { GameSettings } from './gameTypes'

export type UserProfile = {
  id: string
  username: string
  passwordHash?: string
  isGuest?: boolean
  createdAt: number
  lastPlayedAt: number
  settings: GameSettings
  stats: {
    totalPlayTime: number
    gamesPlayed: number
    totalScore: number
    highestCombo: number
  }
  achievements: string[]
}

export type UserSession = {
  currentUser: UserProfile | null
  isLocked: boolean
}
