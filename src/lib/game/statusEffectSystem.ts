export type StatusEffectId = 'invincibility' | 'shield' | 'weapon' | 'speed'

export class StatusEffectSystem {
  private timers = new Map<StatusEffectId, ReturnType<typeof setTimeout>>()

  start(id: StatusEffectId, duration: number, onExpire: () => void): void {
    this.clear(id)

    const timer = setTimeout(() => {
      this.timers.delete(id)
      onExpire()
    }, duration)

    this.timers.set(id, timer)
  }

  clear(id: StatusEffectId): void {
    const timer = this.timers.get(id)
    if (!timer) return

    clearTimeout(timer)
    this.timers.delete(id)
  }

  clearAll(): void {
    this.timers.forEach((timer) => clearTimeout(timer))
    this.timers.clear()
  }

  isActive(id: StatusEffectId): boolean {
    return this.timers.has(id)
  }
}
