import { writable, derived, get } from 'svelte/store'
import type { GameState, GameRoute, GameDifficulty } from '../routes/gameRoutes'
import type { GameSessionState, PlayerStats } from '../types/gameTypes'
import soundManager from '../lib/soundManager'
import { gameManager } from '../lib/gameManager'
import { StorageManager } from '../utils/storageManager'
import { AudioEventHandler } from '../lib/audioIntegration'

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

  AudioEventHandler.initialize()

  return {
    subscribe,
    set,
    update,

    navigateTo: (route: GameRoute) => {
      update((state) => ({
        ...state,
        previousRoute: state.route,
        route
      }))
    },

    goBack: () => {
      update((state) => {
        if (state.previousRoute) {
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
        } else {
          gameManager.resumeGame()
        }

        return { ...state, isPaused: newPauseState }
      })
    },

    toggleSettings: () => {
      update((state) => ({ ...state, showSettings: !state.showSettings }))
    },

    toggleHighScore: () => {
      update((state) => ({ ...state, showHighScore: !state.showHighScore }))
    },

    toggleHelp: () => {
      update((state) => ({ ...state, showHelp: !state.showHelp }))
    },

    toggleExit: () => {
      update((state) => ({ ...state, showExit: !state.showExit }))
    },

    toggleSound: () => {
      update((state) => {
        soundManager.toggleMute()
        return {
          ...state,
          sound: !soundManager.isMutedState()
        }
      })
    },

    adjustVolume: (value: number) => {
      soundManager.setMasterVolume(value)
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

      const syncInterval = setInterval(() => {
        if (!gameManager.isPlaying) {
          clearInterval(syncInterval)
          return
        }

        update((state) => ({
          ...state,
          session: { ...gameManager.session },
          player: { ...gameManager.player },
          score: gameManager.session.score
        }))
      }, 100)
    },

    startStoryMode: (missionId: number) => {
      gameManager.startGame('STORY_MODE', undefined, missionId)

      update((state) => ({
        ...state,
        route: 'STORY_MODE_PLAY',
        session: gameManager.session,
        player: gameManager.player
      }))

      const syncInterval = setInterval(() => {
        if (!gameManager.isPlaying) {
          clearInterval(syncInterval)
          return
        }

        update((state) => ({
          ...state,
          session: { ...gameManager.session },
          player: { ...gameManager.player },
          score: gameManager.session.score
        }))
      }, 100)
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
          master: soundManager.getMasterVolume(),
          music: soundManager.getMusicVolume(),
          sfx: soundManager.getSFXVolume()
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

      soundManager.setMasterVolume(settings.volume.master)
      soundManager.setMusicVolume(settings.volume.music)
      soundManager.setSFXVolume(settings.volume.sfx)
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
