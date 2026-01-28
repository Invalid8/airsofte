import type { Bullet } from '../types/gameTypes'

export class ViewportCuller {
  private cullMargin = 200
  private lastCullTime = 0
  private cullInterval = 1000

  cull<T extends { x: number; y: number; active: boolean; destroy?: () => void }>(
    entities: T[],
    gameWidth: number,
    gameHeight: number,
    currentTime: number
  ): T[] {
    if (currentTime - this.lastCullTime < this.cullInterval) {
      return entities
    }

    this.lastCullTime = currentTime

    return entities.filter((entity) => {
      if (!entity.active) return false

      const outside =
        entity.x < -this.cullMargin ||
        entity.x > gameWidth + this.cullMargin ||
        entity.y < -this.cullMargin ||
        entity.y > gameHeight + this.cullMargin

      if (outside) {
        if (entity.destroy) entity.destroy()
        entity.active = false
        return false
      }

      return true
    })
  }

  cullBullets(bullets: Bullet[], gameHeight: number): Bullet[] {
    return bullets.filter((bullet) => {
      if (!bullet.active) return false
      if (bullet.y < -50 || bullet.y > gameHeight + 50) {
        bullet.active = false
        return false
      }
      return true
    })
  }

  setCullMargin(margin: number): void {
    this.cullMargin = margin
  }

  setCullInterval(interval: number): void {
    this.cullInterval = interval
  }
}

export const viewportCuller = new ViewportCuller()
