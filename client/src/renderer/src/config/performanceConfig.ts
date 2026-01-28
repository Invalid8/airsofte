/* eslint-disable @typescript-eslint/no-explicit-any */
function detectPerformanceTier(): 'low' | 'medium' | 'high' {
  const cores = navigator.hardwareConcurrency || 2
  const memory = (navigator as any).deviceMemory || 4

  if (cores >= 8 && memory >= 8) return 'high'
  if (cores >= 4 && memory >= 4) return 'medium'
  return 'low'
}

export const PERF_TIER = detectPerformanceTier()

export const PERF_CONFIG = {
  low: {
    maxParticles: 50,
    explosionParticles: 8,
    trailParticles: 1,
    hitParticles: 3,
    maxEnemies: 15,
    maxBullets: 30,
    cullMargin: 100,
    cullInterval: 500,
    updateInterval: 2
  },
  medium: {
    maxParticles: 150,
    explosionParticles: 15,
    trailParticles: 2,
    hitParticles: 6,
    maxEnemies: 25,
    maxBullets: 50,
    cullMargin: 150,
    cullInterval: 1000,
    updateInterval: 1
  },
  high: {
    maxParticles: 300,
    explosionParticles: 25,
    trailParticles: 3,
    hitParticles: 10,
    maxEnemies: 40,
    maxBullets: 100,
    cullMargin: 200,
    cullInterval: 1500,
    updateInterval: 1
  }
}

export const CONFIG = PERF_CONFIG[PERF_TIER]

export function limitArray<T>(array: T[], maxSize: number): T[] {
  if (array.length > maxSize) {
    return array.slice(-maxSize)
  }
  return array
}

export class FPSMonitor {
  private frames = 0
  private lastTime = performance.now()
  public fps = 60

  update(): void {
    this.frames++
    const currentTime = performance.now()

    if (currentTime >= this.lastTime + 1000) {
      this.fps = Math.round((this.frames * 1000) / (currentTime - this.lastTime))
      this.frames = 0
      this.lastTime = currentTime
    }
  }

  getFPS(): number {
    return this.fps
  }

  isLowFPS(): boolean {
    return this.fps < 30
  }
}
