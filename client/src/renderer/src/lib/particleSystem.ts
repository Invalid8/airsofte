import { poolManager } from '../utils/objectPool'
import { CONFIG, limitArray } from '../config/performanceConfig'

export type Particle = {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  active: boolean
}

export class ParticleSystem {
  private particles: Particle[] = []
  private particlePool = poolManager.getPool<Particle>('particles')

  constructor() {
    this.initializePool()
  }

  private initializePool(): void {
    if (!this.particlePool) {
      this.particlePool = poolManager.createPool<Particle>(
        'particles',
        () => ({
          id: `p_${Math.random()}`,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          life: 0,
          maxLife: 1,
          size: 4,
          color: '#ffffff',
          active: false
        }),
        (particle) => {
          particle.active = false
          particle.life = 0
        },
        200,
        200
      )
    }
  }

  createExplosion(x: number, y: number, count: number = 20, color: string = '#ff6600'): void {
    const particleCount = Math.min(count, CONFIG.explosionParticles)
    for (let i = 0; i < particleCount; i++) {
      const particle = this.particlePool!.acquire()
      const angle = (Math.PI * 2 * i) / particleCount
      const speed = 2 + Math.random() * 3

      particle.x = x
      particle.y = y
      particle.vx = Math.cos(angle) * speed
      particle.vy = Math.sin(angle) * speed
      particle.life = 1
      particle.maxLife = 1
      particle.size = 3 + Math.random() * 4
      particle.color = color
      particle.active = true

      this.particles.push(particle)
    }
  }

  createTrail(x: number, y: number, color: string = '#00aaff'): void {
    const particle = this.particlePool!.acquire()

    particle.x = x + (Math.random() - 0.5) * 10
    particle.y = y + (Math.random() - 0.5) * 10
    particle.vx = (Math.random() - 0.5) * 0.5
    particle.vy = 1 + Math.random() * 2
    particle.life = 1
    particle.maxLife = 1
    particle.size = 2 + Math.random() * 2
    particle.color = color
    particle.active = true

    this.particles.push(particle)
  }

  createHitEffect(x: number, y: number, count: number = 8): void {
    const particleCount = Math.min(count, CONFIG.hitParticles)
    for (let i = 0; i < particleCount; i++) {
      const particle = this.particlePool!.acquire()
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 2

      particle.x = x
      particle.y = y
      particle.vx = Math.cos(angle) * speed
      particle.vy = Math.sin(angle) * speed
      particle.life = 1
      particle.maxLife = 1
      particle.size = 2 + Math.random() * 3
      particle.color = '#ffaa00'
      particle.active = true

      this.particles.push(particle)
    }
  }

  update(deltaTime: number = 16): void {
    const dt = deltaTime / 16

    this.particles = this.particles.filter((particle) => {
      if (!particle.active) return false

      particle.x += particle.vx * dt
      particle.y += particle.vy * dt
      particle.life -= 0.02 * dt

      if (particle.life <= 0) {
        particle.active = false
        this.particlePool!.release(particle)
        return false
      }

      return true
    })

    this.particles = limitArray(this.particles, CONFIG.maxParticles)
  }

  getActiveParticles(): Particle[] {
    return this.particles.filter((p) => p.active)
  }

  clear(): void {
    this.particles.forEach((p) => {
      p.active = false
      this.particlePool!.release(p)
    })
    this.particles = []
  }
}

export const particleSystem = new ParticleSystem()
