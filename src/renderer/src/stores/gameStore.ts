import { writable } from 'svelte/store'
import { initialGameState, type GameState, type GameRoute } from '../routes/gameRoutes'
import { GameSoundManager } from '../lib/sounds'

export const gameState = writable<GameState>(initialGameState)

export function navigateTo(route: GameRoute): void {
  gameState.update((state: GameState) => ({
    ...state,
    previousRoute: state.route,
    route: route
  }))
}

export function goBack(): void {
  gameState.update((state: GameState) => {
    if (state.previousRoute) {
      return {
        ...state,
        route: state.previousRoute,
        previousRoute: undefined
      }
    }
    return state
  })
}

// Game state functions
export function updateScore(newScore: number): void {
  gameState.update((state: GameState) => ({ ...state, score: newScore }))
}

export function setDifficulty(difficulty: 'Easy' | 'Normal' | 'Hard'): void {
  gameState.update((state: GameState) => ({ ...state, difficulty }))
}

export function toggleTheme(): void {
  gameState.update((state: GameState) => ({
    ...state,
    theme: state.theme === 'Light' ? 'Dark' : 'Light'
  }))
}

export function resetGame(): void {
  gameState.set(initialGameState)
}

export function togglePause(): void {
  gameState.update((state: GameState) => ({ ...state, isPaused: !state.isPaused }))
}

export function toggleSettings(): void {
  gameState.update((state: GameState) => ({ ...state, showSettings: !state.showSettings }))
}

export function toggleHighScore(): void {
  gameState.update((state: GameState) => ({ ...state, showHighScore: !state.showHighScore }))
}

export function toggleHelp(): void {
  gameState.update((state: GameState) => ({ ...state, showHelp: !state.showHelp }))
}

export function toggleExit(): void {
  gameState.update((state: GameState) => ({ ...state, showExit: !state.showExit }))
}

export function exitGame(): void {
  console.log('Exit Game')
  window.electron.ipcRenderer.send('exit')
}

export function toggleSound(): void {
  gameState.update((state: GameState) => GameSoundManager.toggleMute(state))
}

export function adjustVolume(value: number): void {
  GameSoundManager.setVolume(value)
}
