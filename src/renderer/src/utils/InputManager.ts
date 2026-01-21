import { modalManager } from './ModalManager'
import { gameManager } from './gameManager'
import { gameState } from '../stores/gameStore'
import type { GameRoute } from '../routes/gameRoutes'

type InputContext = 'MENU' | 'GAMEPLAY' | 'MODAL' | 'GLOBAL'

class InputManager {
  private static instance: InputManager
  private listeners: Map<string, (event: KeyboardEvent) => void> = new Map()
  private activeContext: InputContext = 'GLOBAL'
  private currentRoute: GameRoute = 'STARTUP'
  private isInitialized = false

  private constructor() {}

  static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager()
    }
    return InputManager.instance
  }

  initialize(): void {
    if (this.isInitialized) return

    window.addEventListener('keydown', this.handleKeyDown.bind(this))
    this.isInitialized = true
  }

  setContext(context: InputContext): void {
    this.activeContext = context
  }

  setRoute(route: GameRoute): void {
    this.currentRoute = route
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.handleEscapeKey(event)
      return
    }

    const handler = this.listeners.get(event.key)
    if (handler) {
      handler(event)
    }
  }

  private handleEscapeKey(event: KeyboardEvent): void {
    event.preventDefault()

    let currentModal: any
    const unsubscribe = modalManager.subscribe((state) => {
      currentModal = state.current
    })
    unsubscribe()

    if (currentModal) {
      if (currentModal === 'PAUSE') {
        gameManager.resumeGame()
        gameState.update((state) => ({
          ...state,
          isPaused: false
        }))
      }
      modalManager.close()
      return
    }

    if (this.currentRoute === 'QUICK_PLAY' || this.currentRoute === 'STORY_MODE_PLAY') {
      if (gameManager.isPlaying && !gameManager.isPaused) {
        gameManager.pauseGame()
        gameState.update((state) => ({
          ...state,
          isPaused: true
        }))
        modalManager.open('PAUSE')
      }
      return
    }

    if (this.currentRoute === 'MAIN_MENU') {
      modalManager.toggle('EXIT')
      return
    }
  }

  registerKey(key: string, handler: (event: KeyboardEvent) => void): () => void {
    this.listeners.set(key, handler)

    return () => {
      this.listeners.delete(key)
    }
  }

  unregisterKey(key: string): void {
    this.listeners.delete(key)
  }

  clearAll(): void {
    this.listeners.clear()
  }

  cleanup(): void {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this))
    this.clearAll()
    this.isInitialized = false
  }
}

export const inputManager = InputManager.getInstance()
