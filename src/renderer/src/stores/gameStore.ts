import { writable, derived, get } from 'svelte/store'
import type { GameState, GameRoute, GameDifficulty } from '../routes/gameRoutes'
import type { GameSessionState, PlayerStats } from '../types/gameTypes'
import { audioManager } from '../utils/AudioManager'
import { modalManager } from '../utils/ModalManager'
import { inputManager } from '../utils/InputManager'
import { gameManager } from '../lib/gameManager'
import { StorageManager } from '../utils/storageManager'

export type ExtendedGameState = GameState & {
  session: GameSessionState | null
  player: PlayerStats | null
}

const initialState: ExtendedGameState = {
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
  session: null,
  player: null
}

function createGameStore() {
  const { subscribe, set, update } = writable<ExtendedGameState>(initialState)

  audioManager.initialize()
  inputManager.initialize()

  return {
    subscribe,
    set,
    update,

    navigateTo: (route: GameRoute) => {
      update((state) => {
        inputManager.setRoute(route)
        return {
          ...state,
          previousRoute: state.route,
          route
        }
      })
    },

    goBack: () => {
      update((state) => {
        if (state.previousRoute) {
          inputManager.setRoute(state.previousRoute)
          return {
            ...state,
            route: state.previousRoute,
            previousRoute: undefined
          }
        }
        return state
      })
    },

    updateScore: (newScore: number) => {
      update((state) => ({ ...state, score: newScore }))
    },

    setDifficulty: (difficulty: GameDifficulty) => {
      update((state) => ({ ...state, difficulty }))
      gameManager.difficulty = difficulty
    },

    toggleTheme: () => {
      update((state) => ({
        ...state,
        theme: state.theme === 'Light' ? 'Dark' : 'Light'
      }))
    },

    togglePause: () => {
      update((state) => {
        const newPauseState = !state.isPaused

        if (newPauseState) {
          gameManager.pauseGame()
          modalManager.open('PAUSE')
        } else {
          gameManager.resumeGame()
          modalManager.close()
        }

        return { ...state, isPaused: newPauseState }
      })
    },

    toggleSettings: () => {
      modalManager.toggle('SETTINGS')
    },

    toggleHighScore: () => {
      modalManager.toggle('HIGH_SCORE')
    },

    toggleHelp: () => {
      modalManager.toggle('HELP')
    },

    toggleExit: () => {
      modalManager.toggle('EXIT')
    },

    toggleSound: () => {
      audioManager.toggleMute()
      update((state) => ({
        ...state,
        sound: !audioManager.isMutedState()
      }))
    },

    adjustVolume: (value: number) => {
      audioManager.setMasterVolume(value)
    },

    startQuickPlay: (difficulty?: GameDifficulty) => {
      const diff = difficulty || get({ subscribe }).difficulty
      gameManager.startGame('QUICK_PLAY', diff)

      update((state) => ({
        ...state,
        route: 'QUICK_PLAY',
        session: gameManager.session,
        player: gameManager.player,
        difficulty: diff
      }))
    },

    startStoryMode: (missionId: number) => {
      gameManager.startGame('STORY_MODE', undefined, missionId)

      update((state) => ({
        ...state,
        route: 'STORY_MODE_PLAY',
        session: gameManager.session,
        player: gameManager.player
      }))
    },

    syncGameState: () => {
      const gmState = gameManager.getGameState()

      update((state) => ({
        ...state,
        session: gmState.session,
        player: gmState.player,
        score: gmState.session.score,
        isPaused: gmState.isPaused
      }))
    },

    endGame: (victory: boolean = false) => {
      gameManager.endGame(victory)

      update((state) => ({
        ...state,
        route: 'GAME_OVER',
        score: gameManager.session.score,
        session: null,
        player: null
      }))
    },

    resetGame: () => {
      set(initialState)
      modalManager.closeAll()
    },

    exitGame: () => {
      if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.send('exit')
      }
    },

    saveSettings: () => {
      const state = get({ subscribe })
      StorageManager.saveSettings({
        volume: {
          master: audioManager.getMasterVolume(),
          music: audioManager.getMusicVolume(),
          sfx: audioManager.getSFXVolume()
        },
        difficulty: state.difficulty,
        keyBindings: {
          up: 'w',
          down: 's',
          left: 'a',
          right: 'd',
          shoot: ' ',
          special: 'Shift',
          pause: 'Escape'
        },
        graphics: {
          particles: true,
          screenShake: true,
          showFPS: false
        }
      })
    },

    loadSettings: () => {
      const settings = StorageManager.getSettings()

      update((state) => ({
        ...state,
        difficulty: settings.difficulty
      }))

      audioManager.setMasterVolume(settings.volume.master)
      audioManager.setMusicVolume(settings.volume.music)
      audioManager.setSFXVolume(settings.volume.sfx)
    }
  }
}

export const gameState = createGameStore()

export const {
  navigateTo,
  goBack,
  updateScore,
  setDifficulty,
  toggleTheme,
  togglePause,
  toggleSettings,
  toggleHighScore,
  toggleHelp,
  toggleExit,
  toggleSound,
  adjustVolume,
  startQuickPlay,
  startStoryMode,
  syncGameState,
  endGame,
  resetGame,
  exitGame,
  saveSettings,
  loadSettings
} = gameState

export const isPlaying = derived(gameState, ($state) => $state.session !== null)
export const currentScore = derived(gameState, ($state) => $state.score)
export const playerHealth = derived(gameState, ($state) => $state.player?.health ?? 0)
export const playerLives = derived(gameState, ($state) => $state.player?.lives ?? 0)
export const currentWave = derived(gameState, ($state) => $state.session?.currentWave ?? 0)
