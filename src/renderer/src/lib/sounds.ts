import { Howl, Howler } from 'howler'
import Sound1 from '../assets/sounds/sound1.mp3'
import Fly from '../assets/sounds/fly.mp3'
import BG1 from '../assets/sounds/bg1.mp3'
import Shoot1 from '../assets/sounds/shoot1.mp3'
import type { GameState } from '../routes/gameRoutes'
// import Shoot2 from '../assets/sounds/shoot2.mp3'

export function clickBtnSound(): void {
  const sound = new Howl({
    src: [Sound1],
    volume: 0.5
  })
  sound.play()
}

export function flyOverSound(): void {
  const sound = new Howl({
    src: [Fly],
    volume: 0.5
  })
  sound.play()
}

export function BgSound1(): Howl {
  const sound = new Howl({
    src: [BG1],
    volume: 0.8,
    loop: true
  })
  return sound
}

export function ShootSound1(): Howl {
  const sound = new Howl({
    src: [Shoot1],
    volume: 0.2
  })
  return sound
}

export class GameSoundManager {
  private static previousVolume = 1.0

  // Toggle mute state and update game state
  static toggleMute(currentState: GameState): GameState {
    const newMuteState = !currentState.sound

    if (!newMuteState) {
      // Store current volume before muting
      this.previousVolume = Howler.volume()
      Howler.volume(0)
    } else {
      // Restore previous volume
      Howler.volume(this.previousVolume)
    }

    return {
      ...currentState,
      sound: newMuteState
    }
  }

  // Mute sounds completely
  static muteAll(currentState: GameState): GameState {
    if (currentState.sound) {
      this.previousVolume = Howler.volume()
      Howler.volume(0)

      return {
        ...currentState,
        sound: true
      }
    }
    return currentState
  }

  // Unmute sounds
  static unmuteAll(currentState: GameState): GameState {
    if (!currentState.sound) {
      Howler.volume(this.previousVolume)

      return {
        ...currentState,
        sound: false
      }
    }
    return currentState
  }

  // Set global volume (independent of mute state)
  static setVolume(volume: number): void {
    Howler.volume(volume)
  }

  // Get current volume
  static getVolume(): number {
    return Howler.volume()
  }
}
