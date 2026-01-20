import { gameEvents } from './eventBus'
import soundManager from './soundManager'

export class AudioEventHandler {
  private static initialized = false

  static initialize(): void {
    if (this.initialized) return
    this.initialized = true

    gameEvents.on('ENEMY_DESTROYED', (event) => {
      const enemy = event.data?.enemy
      if (!enemy) return

      if (enemy.type === 'BOSS') {
        soundManager.playExplosion('large')
        setTimeout(() => soundManager.playExplosion('large'), 200)
        setTimeout(() => soundManager.playExplosion('large'), 400)
      } else if (enemy.type === 'BOMBER') {
        soundManager.playExplosion('medium')
      } else {
        soundManager.playExplosion('small')
      }
    })

    gameEvents.on('PLAYER_HIT', () => {
      soundManager.playSound('playerHit')
    })

    gameEvents.on('PLAYER_DEATH', () => {
      soundManager.playExplosion('medium')
    })

    gameEvents.on('POWERUP_COLLECTED', (event) => {
      const type = event.data?.type
      soundManager.playSound('powerup')

      if (type === 'SCORE') {
        setTimeout(() => soundManager.playSound('powerup'), 100)
      }
    })

    gameEvents.on('WAVE_START', (event) => {
      const wave = event.data?.wave
      if (wave === 5 || event.data?.hasBoss) {
        soundManager.playSound('bossWarning')
        setTimeout(() => {
          soundManager.stopMusic(true)
          setTimeout(() => {
            soundManager.playMusic('boss')
          }, 1000)
        }, 2000)
      }
    })

    gameEvents.on('WAVE_COMPLETE', () => {
      soundManager.stopMusic(true)
      setTimeout(() => {
        soundManager.playMusic('background')
      }, 1000)
    })

    gameEvents.on('GAME_START', () => {
      soundManager.stopMusic(false)
      setTimeout(() => {
        soundManager.playMusic('background')
      }, 500)
    })

    gameEvents.on('GAME_OVER', (event) => {
      soundManager.stopMusic(true)

      setTimeout(() => {
        if (event.data?.victory) {
          soundManager.playSound('victory')
        } else {
          soundManager.playSound('gameOver')
        }
      }, 500)
    })

    gameEvents.on('GAME_PAUSED', () => {
      soundManager.pauseMusic()
    })

    gameEvents.on('GAME_RESUMED', () => {
      soundManager.resumeMusic()
    })

    gameEvents.on('BOSS_DEFEATED', () => {
      soundManager.playExplosion('large')
      setTimeout(() => soundManager.playExplosion('large'), 300)
      setTimeout(() => soundManager.playExplosion('large'), 600)
      setTimeout(() => {
        soundManager.stopMusic(true)
        soundManager.playSound('victory')
      }, 1000)
    })

    gameEvents.on('ENEMY_SPAWNED', (event) => {
      const type = event.data?.type
      if (type === 'BOSS') {
        soundManager.playSound('bossWarning')
      }
    })

    gameEvents.on('SHIELD_ACTIVATED', () => {
      soundManager.playSound('powerup')
    })

    gameEvents.on('SHIELD_BROKEN', () => {
      soundManager.playExplosion('small')
    })

    gameEvents.on('WEAPON_CHANGED', () => {
      soundManager.playSound('powerup')
    })

    gameEvents.on('COMBO_UPDATED', (event) => {
      const multiplier = event.data?.multiplier
      if (multiplier && multiplier >= 2) {
        soundManager.playSound('powerup')
      }
    })

    gameEvents.on('NEW_HIGH_SCORE', () => {
      soundManager.playSound('victory')
    })

    gameEvents.on('PLAYER_RESPAWN', () => {
      soundManager.playSound('powerup')
    })
  }

  static cleanup(): void {
    soundManager.stopAll()
    this.initialized = false
  }

  static setMasterVolume(volume: number): void {
    soundManager.setVolume(volume)
  }

  static setMusicVolume(volume: number): void {
    soundManager.setMusicVolume(volume)
  }

  static setSFXVolume(volume: number): void {
    soundManager.setSFXVolume(volume)
  }

  static toggleMute(): void {
    soundManager.toggleMute()
  }
}
