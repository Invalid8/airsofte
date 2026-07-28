import type { GameDifficulty, GameSessionState } from '$lib/types/gameTypes'
import { DIFFICULTY_MODIFIERS, GAME_CONFIG } from '$lib/config/gameConstants'
import { gameEvents } from './eventBus'
import type { TimedActionSystem } from './timedActionSystem'

export class ScoreSystem {
  constructor(
    private session: GameSessionState,
    private getDifficulty: () => GameDifficulty,
    private timedActions: TimedActionSystem
  ) {}

  setSession(session: GameSessionState): void {
    this.session = session
  }

  addScore(points: number): number {
    const modifier = DIFFICULTY_MODIFIERS[this.getDifficulty()].scoreMultiplier
    const comboBonus = this.session.comboMultiplier
    const finalScore = Math.floor(points * modifier * comboBonus)

    this.session.score += finalScore
    gameEvents.emit('SCORE_UPDATED', { points: finalScore, total: this.session.score })

    return finalScore
  }

  onEnemyDestroyed(points: number): void {
    this.session.enemiesDefeated++
    this.addScore(points)
    this.incrementCombo()
  }

  onBulletFired(): void {
    this.session.bulletsShot++
    this.updateAccuracy()
  }

  resetCombo(): void {
    this.session.comboMultiplier = 1
    this.session.comboTimer = 0
    this.timedActions.cancel('combo')
    gameEvents.emit('COMBO_RESET')
  }

  private updateAccuracy(): void {
    this.session.accuracy =
      this.session.bulletsShot === 0
        ? 0
        : (this.session.enemiesDefeated / this.session.bulletsShot) * 100
  }

  private incrementCombo(): void {
    const maxIndex = GAME_CONFIG.COMBO.MULTIPLIERS.length - 1
    const currentIndex = GAME_CONFIG.COMBO.MULTIPLIERS.indexOf(
      this.session.comboMultiplier as any
    )

    if (currentIndex < maxIndex) {
      this.session.comboMultiplier = GAME_CONFIG.COMBO.MULTIPLIERS[currentIndex + 1]
    }

    this.session.comboTimer = GAME_CONFIG.COMBO.TIMEOUT
    this.timedActions.schedule('combo', GAME_CONFIG.COMBO.TIMEOUT, () => this.resetCombo())
    gameEvents.emit('COMBO_UPDATED', { multiplier: this.session.comboMultiplier })
  }
}
