export type TimedActionId =
  | 'combo'
  | 'gameOver'
  | 'respawn'
  | 'waveStart'
  | 'waveComplete'

export class TimedActionSystem {
  private timers = new Map<TimedActionId, ReturnType<typeof setTimeout>>()

  schedule(id: TimedActionId, delay: number, action: () => void): void {
    this.cancel(id)

    const timer = setTimeout(() => {
      this.timers.delete(id)
      action()
    }, delay)

    this.timers.set(id, timer)
  }

  cancel(id: TimedActionId): void {
    const timer = this.timers.get(id)
    if (!timer) return

    clearTimeout(timer)
    this.timers.delete(id)
  }

  cancelAll(): void {
    this.timers.forEach((timer) => clearTimeout(timer))
    this.timers.clear()
  }
}
