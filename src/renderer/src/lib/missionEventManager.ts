import type { PowerUpType } from '../types/gameTypes'
import { gameEvents } from './eventBus'
import { audioManager } from '../utils/AudioManager'

export type MissionEventType =
  | 'REINFORCEMENTS'
  | 'SUPPLY_DROP'
  | 'ALLY_SUPPORT'
  | 'ENEMY_RETREAT'
  | 'HAZARD_INCOMING'
  | 'BONUS_OBJECTIVE'

export type MissionEvent = {
  id: string
  type: MissionEventType
  triggerTime?: number
  triggerCondition?: 'WAVE_START' | 'WAVE_END' | 'ENEMIES_REMAINING' | 'HEALTH_LOW' | 'TIME_ELAPSED'
  conditionValue?: number
  data?: any
  executed: boolean
}

export type SupplyDropData = {
  powerUpType: PowerUpType
  x: number
  y: number
  guaranteed: boolean
}

export type ReinforcementData = {
  enemyType: string
  count: number
  pattern: string
  message?: string
}

export class MissionEventManager {
  private events: MissionEvent[] = []
  private missionStartTime: number = 0
  private currentWave: number = 0

  startMission(events: MissionEvent[] = []): void {
    this.events = events.map((e) => ({ ...e, executed: false }))
    this.missionStartTime = Date.now()
    this.currentWave = 0
  }

  update(gameState: {
    timeElapsed: number
    currentWave: number
    enemiesRemaining: number
    playerHealth: number
    playerMaxHealth: number
  }): void {
    const now = Date.now()
    const elapsed = now - this.missionStartTime

    this.events.forEach((event) => {
      if (event.executed) return

      let shouldTrigger = false

      if (event.triggerTime !== undefined) {
        shouldTrigger = elapsed >= event.triggerTime
      }

      if (event.triggerCondition) {
        switch (event.triggerCondition) {
          case 'WAVE_START':
            shouldTrigger = gameState.currentWave === event.conditionValue
            break
          case 'WAVE_END':
            shouldTrigger =
              this.currentWave !== gameState.currentWave &&
              gameState.currentWave === event.conditionValue
            break
          case 'ENEMIES_REMAINING':
            shouldTrigger = gameState.enemiesRemaining <= (event.conditionValue || 0)
            break
          case 'HEALTH_LOW':
            shouldTrigger =
              (gameState.playerHealth / gameState.playerMaxHealth) * 100 <=
              (event.conditionValue || 30)
            break
          case 'TIME_ELAPSED':
            shouldTrigger = elapsed >= (event.conditionValue || 0)
            break
        }
      }

      if (shouldTrigger) {
        this.executeEvent(event)
        event.executed = true
      }
    })

    this.currentWave = gameState.currentWave
  }

  private executeEvent(event: MissionEvent): void {
    console.log(`🎬 Mission Event: ${event.type}`)

    switch (event.type) {
      case 'SUPPLY_DROP':
        this.triggerSupplyDrop(event.data)
        break
      case 'REINFORCEMENTS':
        this.triggerReinforcements(event.data)
        break
      case 'ALLY_SUPPORT':
        this.triggerAllySupport(event.data)
        break
      case 'ENEMY_RETREAT':
        this.triggerEnemyRetreat(event.data)
        break
      case 'HAZARD_INCOMING':
        this.triggerHazard(event.data)
        break
      case 'BONUS_OBJECTIVE':
        this.triggerBonusObjective(event.data)
        break
    }

    gameEvents.emit('MISSION_EVENT', {
      type: event.type,
      data: event.data
    })
  }

  private triggerSupplyDrop(data: SupplyDropData): void {
    audioManager.playSound('powerup')

    gameEvents.emit('SPAWN_POWERUP', {
      type: data.powerUpType,
      x: data.x,
      y: data.y,
      guaranteed: data.guaranteed
    })

    gameEvents.emit('SHOW_MESSAGE', {
      text: '📦 Supply Drop Incoming!',
      duration: 3000,
      color: '#00ff88'
    })
  }

  private triggerReinforcements(data: ReinforcementData): void {
    gameEvents.emit('SPAWN_REINFORCEMENTS', {
      enemyType: data.enemyType,
      count: data.count,
      pattern: data.pattern
    })

    gameEvents.emit('SHOW_MESSAGE', {
      text: data.message || '⚠️ Enemy Reinforcements Detected!',
      duration: 3000,
      color: '#ff6600'
    })
  }

  private triggerAllySupport(data: any): void {
    gameEvents.emit('SHOW_MESSAGE', {
      text: '✈️ Allied Squadron Providing Support!',
      duration: 3000,
      color: '#00aaff'
    })

    gameEvents.emit('CLEAR_ENEMY_BULLETS', {})
  }

  private triggerEnemyRetreat(data: any): void {
    gameEvents.emit('SHOW_MESSAGE', {
      text: '🏃 Enemy Forces Retreating!',
      duration: 3000,
      color: '#ffaa00'
    })

    gameEvents.emit('ENEMY_RETREAT', {
      clearAll: data?.clearAll || false
    })
  }

  private triggerHazard(data: any): void {
    gameEvents.emit('SHOW_MESSAGE', {
      text: '☄️ Incoming Hazard - Take Evasive Action!',
      duration: 3000,
      color: '#ff0000'
    })
  }

  private triggerBonusObjective(data: any): void {
    gameEvents.emit('SHOW_MESSAGE', {
      text: '⭐ Bonus Objective Available!',
      duration: 4000,
      color: '#ffd700'
    })

    gameEvents.emit('ADD_BONUS_OBJECTIVE', data)
  }

  clearEvents(): void {
    this.events = []
  }

  getActiveEvents(): MissionEvent[] {
    return this.events.filter((e) => !e.executed)
  }
}

export const missionEventManager = new MissionEventManager()
