export type GameRoute =
  | 'STARTUP'
  | 'MAIN_MENU'
  | 'GAME_SCREEN'
  | 'PAUSE_MENU'
  | 'GAME_OVER'
  | 'SETTINGS'
  | 'HIGH_SCORE'
  | 'HELP'
  | 'QUICK_PLAY'
  | 'STORY_MODE_MENU'
  | 'STORY_MODE_PLAY'
  | 'DEBUG'
  | 'EXIT'
  | 'AI_MISSIONS'

export type GameDifficulty = 'Easy' | 'Normal' | 'Hard'

export type GameState = {
  route: GameRoute
  score: number
  difficulty: 'Easy' | 'Normal' | 'Hard'
  sound: boolean
  theme: 'Light' | 'Dark'
  previousRoute?: GameRoute
  isPaused?: boolean
  showHighScore?: boolean
  showSettings?: boolean
  showHelp?: boolean
  showExit?: boolean
  currentMissionId?: number
}

export const initialGameState: GameState = {
  route: 'STARTUP',
  score: 0,
  difficulty: 'Normal',
  sound: true,
  theme: 'Dark',
  previousRoute: undefined,
  isPaused: false,
  showHighScore: false,
  showSettings: false,
  showHelp: false,
  showExit: false,
  currentMissionId: undefined
}
