import { Howl, Howler } from 'howler'

interface SoundConfig {
  src: string
  volume?: number
  loop?: boolean
  pool?: number
}

class SoundManager {
  private sounds: Map<string, Howl> = new Map()
  private music: Map<string, Howl> = new Map()
  private masterVolume = 1.0
  private musicVolume = 0.6
  private sfxVolume = 0.8
  private isMuted = false

  constructor() {
    this.loadSounds()
    this.loadMusic()
  }

  private loadSounds() {
    const soundConfigs: Record<string, SoundConfig> = {
      shoot1: { src: '/assets/sounds/shoot1.mp3', volume: 0.3, pool: 5 },
      'enemy-shoot': { src: '/assets/sounds/enemy-shoot.mp3', volume: 0.25, pool: 5 },
      'explosion-1': { src: '/assets/sounds/explosion-1.mp3', volume: 0.5, pool: 3 },
      'explosion-2': { src: '/assets/sounds/explosion-2.mp3', volume: 0.6, pool: 3 },
      'explosion-3': { src: '/assets/sounds/explosion-3.mp3', volume: 0.7, pool: 2 },
      'player-hit': { src: '/assets/sounds/player-hit.mp3', volume: 0.6 },
      powerup: { src: '/assets/sounds/powerup.mp3', volume: 0.5 },
      'boss-warning': { src: '/assets/sounds/boss-warning.mp3', volume: 0.7 },
      victory: { src: '/assets/sounds/victory.mp3', volume: 0.6 },
      'game-over': { src: '/assets/sounds/game-over.mp3', volume: 0.6 },
      sound1: { src: '/assets/sounds/sound1.mp3', volume: 0.4 },
      fly: { src: '/assets/sounds/fly.mp3', volume: 0.3, loop: true },
      playerHit: { src: '/assets/sounds/player-hit.mp3', volume: 0.6 },
      bossWarning: { src: '/assets/sounds/boss-warning.mp3', volume: 0.7 },
      gameOver: { src: '/assets/sounds/game-over.mp3', volume: 0.6 }
    }

    Object.entries(soundConfigs).forEach(([key, config]) => {
      this.sounds.set(
        key,
        new Howl({
          src: [config.src],
          volume: (config.volume || 0.5) * this.sfxVolume * this.masterVolume,
          loop: config.loop || false,
          pool: config.pool || 1
        })
      )
    })
  }

  private loadMusic() {
    const musicConfigs: Record<string, SoundConfig> = {
      background: { src: '/assets/sounds/bg1.mp3', volume: 0.4, loop: true },
      boss: { src: '/assets/sounds/boss-battle.mp3', volume: 0.5, loop: true }
    }

    Object.entries(musicConfigs).forEach(([key, config]) => {
      this.music.set(
        key,
        new Howl({
          src: [config.src],
          volume: (config.volume || 0.5) * this.musicVolume * this.masterVolume,
          loop: config.loop || false
        })
      )
    })
  }

  playSound(soundName: string, volumeOverride?: number) {
    if (this.isMuted) return

    const sound = this.sounds.get(soundName)
    if (sound) {
      if (volumeOverride !== undefined) {
        sound.volume(volumeOverride * this.sfxVolume * this.masterVolume)
      }
      sound.play()
    }
  }

  playExplosion(size: 'small' | 'medium' | 'large') {
    const explosionMap = {
      small: 'explosion-1',
      medium: 'explosion-2',
      large: 'explosion-3'
    }
    this.playSound(explosionMap[size])
  }

  playMusic(musicName: string, loop = true, volumeOverride?: number) {
    if (this.isMuted) return

    const music = this.music.get(musicName)
    if (music) {
      music.loop(loop)
      if (volumeOverride !== undefined) {
        music.volume(volumeOverride * this.musicVolume * this.masterVolume)
      }
      music.play()
    }
  }

  stopMusic(fadeOut = false) {
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
  }

  stopAllMusic() {
    this.music.forEach((music) => music.stop())
  }

  pauseMusic() {
    this.music.forEach((music) => {
      if (music.playing()) {
        music.pause()
      }
    })
  }

  resumeMusic() {
    this.music.forEach((music) => {
      if (!music.playing()) {
        music.play()
      }
    })
  }

  fadeOutMusic(musicName: string, duration = 1000) {
    const music = this.music.get(musicName)
    if (music && music.playing()) {
      music.fade(music.volume(), 0, duration)
      setTimeout(() => music.stop(), duration)
    }
  }

  fadeInMusic(musicName: string, targetVolume = 0.5, duration = 1000) {
    const music = this.music.get(musicName)
    if (music) {
      music.volume(0)
      music.play()
      music.fade(0, targetVolume * this.musicVolume * this.masterVolume, duration)
    }
  }

  setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume))
    Howler.volume(this.masterVolume)
    this.updateAllVolumes()
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume))
    this.updateAllVolumes()
  }

  setSFXVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume))
    this.updateAllVolumes()
  }

  private updateAllVolumes() {
    this.music.forEach((music, key) => {
      const baseVolume = key === 'boss' ? 0.5 : 0.4
      music.volume(baseVolume * this.musicVolume * this.masterVolume)
    })

    this.sounds.forEach((sound) => {
      const currentVol = sound.volume()
      sound.volume(currentVol * this.sfxVolume * this.masterVolume)
    })
  }

  mute() {
    this.isMuted = true
    Howler.mute(true)
  }

  unmute() {
    this.isMuted = false
    Howler.mute(false)
  }

  toggleMute() {
    if (this.isMuted) {
      this.unmute()
    } else {
      this.mute()
    }
  }

  stopAll() {
    this.stopAllMusic()
    this.sounds.forEach((sound) => sound.stop())
  }

  setVolume(volume: number) {
    this.setMasterVolume(volume)
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

const init = new SoundManager()

export default init
