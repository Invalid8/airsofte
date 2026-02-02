import { modalManager } from './ModalManager'
import { gameManager } from '../lib/gameManager'
import { gameState } from '../stores/gameStore'
import type { GameRoute } from '../routes/gameRoutes'

type InputContext = 'MENU' | 'GAMEPLAY' | 'MODAL' | 'GLOBAL'

type ContextualHandler = {
  handler: (event: KeyboardEvent) => void
  context: InputContext
}

class InputManager {
  private static instance: InputManager
  private listeners: Map<string, ContextualHandler[]> = new Map()
  private activeContext: InputContext = 'GLOBAL'
  private currentRoute: GameRoute = 'STARTUP'
  private isInitialized = false
  private boundKeyDownHandler: (event: KeyboardEvent) => void

  private constructor() {
    this.boundKeyDownHandler = this.handleKeyDown.bind(this)
  }

  static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager()
    }
    return InputManager.instance
  }

  initialize(): void {
    if (this.isInitialized) return

    window.addEventListener('keydown', this.boundKeyDownHandler)
    this.isInitialized = true
  }

  setContext(context: InputContext): void {
    this.activeContext = context
  }

  setRoute(route: GameRoute): void {
    this.currentRoute = route
  }

  getContext(): InputContext {
    return this.activeContext
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.handleEscapeKey(event)
      return
    }

    const handlers = this.listeners.get(event.key)
    if (!handlers || handlers.length === 0) return

    const modalHandler = handlers.find((h) => h.context === 'MODAL')
    const contextHandler = handlers.find((h) => h.context === this.activeContext)
    const globalHandler = handlers.find((h) => h.context === 'GLOBAL')

    let selectedHandler: ContextualHandler | undefined

    if (this.activeContext === 'MODAL' && modalHandler) {
      selectedHandler = modalHandler
    } else if (contextHandler) {
      selectedHandler = contextHandler
    } else if (globalHandler) {
      selectedHandler = globalHandler
    }

    if (selectedHandler) {
      selectedHandler.handler(event)
    }
  }

  private handleEscapeKey(event: KeyboardEvent): void {
    event.preventDefault()

    let currentModal: string | null = null
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

  /**
   * Register a key handler for a specific context
   * @param key - The keyboard key to listen for
   * @param handler - The function to call when the key is pressed
   * @param context - The context in which this handler should be active (default: GLOBAL)
   * @returns A cleanup function to unregister this specific handler
   */
  registerKey(
    key: string,
    handler: (event: KeyboardEvent) => void,
    context: InputContext = 'GLOBAL'
  ): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, [])
    }

    const handlers = this.listeners.get(key)!
    const contextualHandler: ContextualHandler = { handler, context }
    handlers.push(contextualHandler)

    return () => {
      const index = handlers.indexOf(contextualHandler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
      if (handlers.length === 0) {
        this.listeners.delete(key)
      }
    }
  }

  unregisterKey(key: string): void {
    this.listeners.delete(key)
  }

  unregisterContext(context: InputContext): void {
    this.listeners.forEach((handlers, key) => {
      const filtered = handlers.filter((h) => h.context !== context)
      if (filtered.length === 0) {
        this.listeners.delete(key)
      } else {
        this.listeners.set(key, filtered)
      }
    })
  }

  hasHandler(key: string, context?: InputContext): boolean {
    const handlers = this.listeners.get(key)
    if (!handlers) return false

    if (context) {
      return handlers.some((h) => h.context === context)
    }

    return handlers.length > 0
  }

  getRegisteredKeys(): string[] {
    return Array.from(this.listeners.keys())
  }

  clearAll(): void {
    this.listeners.clear()
  }

  cleanup(): void {
    window.removeEventListener('keydown', this.boundKeyDownHandler)
    this.clearAll()
    this.isInitialized = false
  }
}

export const inputManager = InputManager.getInstance()
