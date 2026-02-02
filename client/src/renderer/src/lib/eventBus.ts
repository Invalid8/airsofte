/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GameEvent } from '../types/gameTypes'

type EventCallback = (event: GameEvent) => void

class GameEventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map()

  on(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }

    this.listeners.get(eventType)!.add(callback)

    return () => this.off(eventType, callback)
  }

  off(eventType: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(eventType)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this.listeners.delete(eventType)
      }
    }
  }

  emit(eventType: string, data?: any): void {
    const event: GameEvent = {
      type: eventType as any,
      data,
      timestamp: Date.now()
    }

    const callbacks = this.listeners.get(eventType)
    if (callbacks) {
      callbacks.forEach((callback) => callback(event))
    }
  }

  clear(): void {
    this.listeners.clear()
  }

  removeAllListeners(eventType?: string): void {
    if (eventType) {
      this.listeners.delete(eventType)
    } else {
      this.listeners.clear()
    }
  }
}

export const gameEvents = new GameEventBus()
