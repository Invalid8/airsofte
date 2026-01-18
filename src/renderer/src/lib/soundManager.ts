import { Howl, Howler } from 'howler'
import { SOUNDS } from '../config/gameConstants'

class SoundManager {
  private sounds: Map<string, Howl> = new Map()
  private musicTracks: Map<string, Howl> = new Map()
  private currentMusic: Howl | null = null
  private isMuted: boolean = false

  constructor() {
    this.initializeSounds()
  }

  private initializeSounds(): void {
    this.sounds.set(
      'shoot',
      new Howl({
        src: [SOUNDS.PLAYER_SHOOT],
        volume: 0.3,
        pool: 10
      })
    )

    this.sounds.set(
      'enemyShoot',
      new Howl({
        src: [SOUNDS.ENEMY_SHOOT],
        volume: 0.2,
        pool: 10
      })
    )

    this.sounds.set(
      'explosionSmall',
      new Howl({
        src: [SOUNDS.EXPLOSION_SMALL],
        volume: 0.4,
        pool: 5
      })
    )

    this.sounds.set(
      'explosionMedium',
      new Howl({
        src: [SOUNDS.EXPLOSION_MEDIUM],
        volume: 0.5,
        pool: 5
      })
    )

    this.sounds.set(
      'explosionLarge',
      new Howl({
        src: [SOUNDS.EXPLOSION_LARGE],
        volume: 0.6,
        pool: 3
      })
    )

    this.sounds.set(
      'playerHit',
      new Howl({
        src: [SOUNDS.PLAYER_HIT],
        volume: 0.5
      })
    )

    this.sounds.set(
      'powerup',
      new Howl({
        src: [SOUNDS.POWERUP],
        volume: 0.4
      })
    )

    this.sounds.set(
      'bossWarning',
      new Howl({
        src: [SOUNDS.BOSS_WARNING],
        volume: 0.6
      })
    )

    this.sounds.set(
      'victory',
      new Howl({
        src: [SOUNDS.VICTORY],
        volume: 0.7
      })
    )

    this.sounds.set(
      'gameOver',
      new Howl({
        src: [SOUNDS.GAME_OVER],
        volume: 0.6
      })
    )

    this.sounds.set(
      'menuClick',
      new Howl({
        src: [SOUNDS.MENU_CLICK],
        volume: 0.5
      })
    )

    this.sounds.set(
      'flyOver',
      new Howl({
        src: [SOUNDS.FLY_OVER],
        volume: 0.5
      })
    )

    this.musicTracks.set(
      'background',
      new Howl({
        src: [SOUNDS.BG_MUSIC],
        volume: 0.6,
        loop: true
      })
    )

    this.musicTracks.set(
      'boss',
      new Howl({
        src: [SOUNDS.BOSS_BATTLE],
        volume: 0.7,
        loop: true
      })
    )
  }

  play(soundName: string): void {
    if (this.isMuted) return

    const sound = this.sounds.get(soundName)
    if (sound) {
      sound.play()
    }
  }

  playMusic(trackName: string, fadeIn: boolean = true): void {
    const track = this.musicTracks.get(trackName)
    if (!track) return

    if (this.currentMusic && this.currentMusic !== track) {
      this.stopMusic(true)
    }

    this.currentMusic = track

    if (fadeIn) {
      track.volume(0)
      track.play()
      track.fade(0, 0.6, 2000)
    } else {
      track.play()
    }
  }

  stopMusic(fadeOut: boolean = true): void {
    if (!this.currentMusic) return

    if (fadeOut) {
      this.currentMusic.fade(this.currentMusic.volume(), 0, 1000)
      setTimeout(() => {
        this.currentMusic?.stop()
        this.currentMusic = null
      }, 1000)
    } else {
      this.currentMusic.stop()
      this.currentMusic = null
    }
  }

  pauseMusic(): void {
    this.currentMusic?.pause()
  }

  resumeMusic(): void {
    this.currentMusic?.play()
  }

  setVolume(volume: number): void {
    Howler.volume(volume)
  }

  setMusicVolume(volume: number): void {
    this.musicTracks.forEach((track) => track.volume(volume))
  }

  setSFXVolume(volume: number): void {
    this.sounds.forEach((sound) => sound.volume(volume))
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
    this.isMuted = !this.isMuted
    Howler.mute(this.isMuted)
  }

  stopAll(): void {
    Howler.stop()
    this.currentMusic = null
  }

  playExplosion(size: 'small' | 'medium' | 'large' = 'medium'): void {
    const soundMap = {
      small: 'explosionSmall',
      medium: 'explosionMedium',
      large: 'explosionLarge'
    }
    this.play(soundMap[size])
  }

  playRandomExplosion(): void {
    const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large']
    const randomSize = sizes[Math.floor(Math.random() * sizes.length)]
    this.playExplosion(randomSize)
  }
}

export const soundManager = new SoundManager()
