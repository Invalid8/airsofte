import { Howl, Howler } from 'howler'
import { gameEvents } from '../lib/eventBus'

import menuClickMp3 from '../assets/sounds/sound1.mp3'
import shootMp3 from '../assets/sounds/shoot1.mp3'
import enemyShootMp3 from '../assets/sounds/enemy-shoot.mp3'
import explosion1Mp3 from '../assets/sounds/explosion-1.mp3'
import explosion2Mp3 from '../assets/sounds/explosion-2.mp3'
import explosion3Mp3 from '../assets/sounds/explosion-3.mp3'
import playerHitMp3 from '../assets/sounds/player-hit.mp3'
import powerupMp3 from '../assets/sounds/powerup.mp3'
import bossWarningMp3 from '../assets/sounds/boss-warning.mp3'
import victoryMp3 from '../assets/sounds/victory.mp3'
import gameOverMp3 from '../assets/sounds/game-over.mp3'
import flyMp3 from '../assets/sounds/fly.mp3'
import backgroundMusicMp3 from '../assets/sounds/bg1.mp3'
import bossMusicMp3 from '../assets/sounds/boss-battle.mp3'

interface AudioConfig {
  src: string
  volume?: number
  loop?: boolean
  pool?: number
}

class AudioManager {
  private static instance: AudioManager
  private sounds: Map<string, Howl> = new Map()
  private music: Map<string, Howl> = new Map()
  private currentMusic: string | null = null
  private musicFadeId: number | null = null

  private masterVolume = 1.0
  private musicVolume = 0.6
  private sfxVolume = 0.8
  private isMuted = false
  private initialized = false

  private eventCleanups: (() => void)[] = []

  // private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  initialize(): void {
    if (this.initialized) return

    this.loadSounds()
    this.loadMusic()
    this.setupEventListeners()
    this.initialized = true
  }

  private loadSounds(): void {
    const soundConfigs: Record<string, AudioConfig> = {
      menuClick: { src: menuClickMp3, volume: 0.3, pool: 5 },
      shoot: { src: shootMp3, volume: 0.3, pool: 5 },
      enemyShoot: { src: enemyShootMp3, volume: 0.25, pool: 5 },
      'explosion-1': { src: explosion1Mp3, volume: 0.5, pool: 3 },
      'explosion-2': { src: explosion2Mp3, volume: 0.6, pool: 3 },
      'explosion-3': { src: explosion3Mp3, volume: 0.7, pool: 2 },
      playerHit: { src: playerHitMp3, volume: 0.6 },
      powerup: { src: powerupMp3, volume: 0.5 },
      bossWarning: { src: bossWarningMp3, volume: 0.7 },
      victory: { src: victoryMp3, volume: 0.6 },
      gameOver: { src: gameOverMp3, volume: 0.6 },
      flyOver: { src: flyMp3, volume: 0.3, loop: false }
    }

    Object.entries(soundConfigs).forEach(([key, config]) => {
      this.sounds.set(
        key,
        new Howl({
          src: [config.src],
          volume: (config.volume ?? 0.5) * this.sfxVolume * this.masterVolume,
          loop: config.loop ?? false,
          pool: config.pool ?? 1
        })
      )
    })
  }

  private loadMusic(): void {
    const musicConfigs: Record<string, AudioConfig> = {
      background: { src: backgroundMusicMp3, volume: 0.4, loop: true },
      boss: { src: bossMusicMp3, volume: 0.5, loop: true }
    }

    Object.entries(musicConfigs).forEach(([key, config]) => {
      this.music.set(
        key,
        new Howl({
          src: [config.src],
          volume: (config.volume ?? 0.5) * this.musicVolume * this.masterVolume,
          loop: config.loop ?? false
        })
      )
    })
  }

  private setupEventListeners(): void {
    this.eventCleanups.push(
      gameEvents.on('ENEMY_DESTROYED', (event) => {
        const enemy = event.data?.enemy
        if (!enemy) return

        if (enemy.type === 'BOSS') {
          this.playExplosion('large')
          setTimeout(() => this.playExplosion('large'), 200)
          setTimeout(() => this.playExplosion('large'), 400)
        } else if (enemy.type === 'BOMBER') {
          this.playExplosion('medium')
        } else {
          this.playExplosion('small')
        }
      })
    )

    this.eventCleanups.push(gameEvents.on('PLAYER_HIT', () => this.playSound('playerHit')))
    this.eventCleanups.push(gameEvents.on('PLAYER_DEATH', () => this.playExplosion('medium')))

    this.eventCleanups.push(
      gameEvents.on('POWERUP_COLLECTED', (event) => {
        this.playSound('powerup')
        if (event.data?.type === 'SCORE') {
          setTimeout(() => this.playSound('powerup'), 100)
        }
      })
    )

    this.eventCleanups.push(
      gameEvents.on('WAVE_START', (event) => {
        if (event.data?.wave === 5 || event.data?.hasBoss) {
          this.playSound('bossWarning')
          setTimeout(() => {
            this.switchMusic('boss', 1000)
          }, 2000)
        }
      })
    )

    this.eventCleanups.push(
      gameEvents.on('WAVE_COMPLETE', () => {
        this.switchMusic('background', 1000)
      })
    )

    this.eventCleanups.push(
      gameEvents.on('GAME_START', () => {
        this.switchMusic('background', 500)
      })
    )

    this.eventCleanups.push(
      gameEvents.on('GAME_OVER', (event) => {
        this.stopMusic(true)
        setTimeout(() => {
          this.playSound(event.data?.victory ? 'victory' : 'gameOver')
        }, 500)
      })
    )

    this.eventCleanups.push(gameEvents.on('GAME_PAUSED', () => this.pauseMusic()))
    this.eventCleanups.push(gameEvents.on('GAME_RESUMED', () => this.resumeMusic()))

    this.eventCleanups.push(
      gameEvents.on('BOSS_DEFEATED', () => {
        for (let i = 0; i < 8; i++) {
          setTimeout(() => {
            this.playExplosion('large')
          }, i * 200)
        }

        setTimeout(() => {
          this.stopMusic(true)
        }, 1400)

        setTimeout(() => {
          this.playSound('victory')
        }, 2000)
      })
    )
  }

  playSound(soundName: string, volumeOverride?: number): void {
    if (this.isMuted) return

    const sound = this.sounds.get(soundName)
    if (sound) {
      if (volumeOverride !== undefined) {
        sound.volume(volumeOverride * this.sfxVolume * this.masterVolume)
      }
      sound.play()
    }
  }

  playExplosion(size: 'small' | 'medium' | 'large'): void {
    const explosionMap = {
      small: 'explosion-1',
      medium: 'explosion-2',
      large: 'explosion-3'
    }
    this.playSound(explosionMap[size])
  }

  playMusic(musicName: string): void {
    if (this.isMuted) return

    this.stopAllMusic()

    const music = this.music.get(musicName)
    if (music) {
      music.play()
      this.currentMusic = musicName
    }
  }

  switchMusic(musicName: string, fadeTime: number = 1000): void {
    if (this.currentMusic === musicName) return

    // Cancel any pending fade operation
    if (this.musicFadeId !== null) {
      clearTimeout(this.musicFadeId)
      this.musicFadeId = null
    }

    if (this.currentMusic) {
      const oldMusic = this.music.get(this.currentMusic)
      if (oldMusic && oldMusic.playing()) {
        oldMusic.fade(oldMusic.volume(), 0, fadeTime)
        setTimeout(() => oldMusic.stop(), fadeTime)
      }
    }

    this.musicFadeId = window.setTimeout(() => {
      const newMusic = this.music.get(musicName)
      if (newMusic) {
        newMusic.volume(0)
        newMusic.play()
        newMusic.fade(
          0,
          (musicName === 'boss' ? 0.5 : 0.4) * this.musicVolume * this.masterVolume,
          fadeTime
        )
        this.currentMusic = musicName
      }
      this.musicFadeId = null
    }, fadeTime / 2)
  }

  stopMusic(fadeOut: boolean = false): void {
    // Cancel any pending fade operation
    if (this.musicFadeId !== null) {
      clearTimeout(this.musicFadeId)
      this.musicFadeId = null
    }

    if (fadeOut) {
      this.music.forEach((music) => {
        if (music.playing()) {
          music.fade(music.volume(), 0, 1000)
          setTimeout(() => music.stop(), 1000)
        }
      })
    } else {
      this.stopAllMusic()
    }
    this.currentMusic = null
  }

  stopAllMusic(): void {
    // Cancel any pending fade operation
    if (this.musicFadeId !== null) {
      clearTimeout(this.musicFadeId)
      this.musicFadeId = null
    }

    this.music.forEach((music) => music.stop())
    this.currentMusic = null
  }

  pauseMusic(): void {
    this.music.forEach((music) => {
      if (music.playing()) music.pause()
    })
  }

  resumeMusic(): void {
    if (this.currentMusic) {
      const music = this.music.get(this.currentMusic)
      if (music) music.play()
    }
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume))
    Howler.volume(this.masterVolume)
    this.updateAllVolumes()
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume))
    this.updateAllVolumes()
  }

  setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume))
    this.updateAllVolumes()
  }

  private updateAllVolumes(): void {
    this.music.forEach((music, key) => {
      const baseVolume = key === 'boss' ? 0.5 : 0.4
      music.volume(baseVolume * this.musicVolume * this.masterVolume)
    })

    this.sounds.forEach((sound) => {
      const currentVol = sound.volume()
      sound.volume(currentVol * this.sfxVolume * this.masterVolume)
    })
  }

  mute(): void {
    this.isMuted = true
    Howler.mute(true)
  }

  unmute(): void {
    this.isMuted = false
    Howler.mute(false)
  }

  toggleMute(): void {
    if (this.isMuted) {
      this.unmute()
    } else {
      this.mute()
    }
  }

  stopAll(): void {
    this.stopAllMusic()
    this.sounds.forEach((sound) => sound.stop())
  }

  cleanup(): void {
    // Cancel any pending fade operation
    if (this.musicFadeId !== null) {
      clearTimeout(this.musicFadeId)
      this.musicFadeId = null
    }

    this.eventCleanups.forEach((cleanup) => cleanup())
    this.eventCleanups = []
    this.stopAll()
    this.initialized = false
  }

  getMasterVolume(): number {
    return this.masterVolume
  }

  getMusicVolume(): number {
    return this.musicVolume
  }

  getSFXVolume(): number {
    return this.sfxVolume
  }

  isMutedState(): boolean {
    return this.isMuted
  }
}

export const audioManager = AudioManager.getInstance()
