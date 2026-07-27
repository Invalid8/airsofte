import { poolManager } from '$lib/utils/objectPool'
import { GAME_CONFIG } from '$lib/config/gameConstants'

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
  private readonly maxActiveParticles = GAME_CONFIG.LIMITS.PARTICLES

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
        GAME_CONFIG.POOL_SIZES.PARTICLES,
        GAME_CONFIG.POOL_SIZES.PARTICLES
      )
    }
  }

  createExplosion(x: number, y: number, count: number = 20, color: string = '#ff6600'): void {
    const availableSlots = Math.max(0, this.maxActiveParticles - this.particles.length)
    const particleCount = Math.min(count, availableSlots)

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / count
      const speed = 2 + Math.random() * 3
      this.emitParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        size: 3 + Math.random() * 4,
        color
      })
    }
  }

  createTrail(x: number, y: number, color: string = '#00aaff'): void {
    this.emitParticle({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 1 + Math.random() * 2,
      life: 1,
      maxLife: 1,
      size: 2 + Math.random() * 2,
      color
    })
  }

  createHitEffect(x: number, y: number, count: number = 8): void {
    const availableSlots = Math.max(0, this.maxActiveParticles - this.particles.length)
    const particleCount = Math.min(count, availableSlots)

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 2
      this.emitParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        size: 2 + Math.random() * 3,
        color: '#ffaa00'
      })
    }
  }

  emitParticle(config: Omit<Particle, 'id' | 'active'>): Particle | null {
    if (this.particles.length >= this.maxActiveParticles) return null

    const particle = this.particlePool!.acquire()
    particle.x = config.x
    particle.y = config.y
    particle.vx = config.vx
    particle.vy = config.vy
    particle.life = config.life
    particle.maxLife = config.maxLife
    particle.size = config.size
    particle.color = config.color
    particle.active = true
    this.particles.push(particle)

    return particle
  }

  update(deltaTime: number = 16): void {
    const dt = deltaTime / 16
    let activeCount = 0

    for (const particle of this.particles) {
      if (!particle.active) continue

      particle.x += particle.vx * dt
      particle.y += particle.vy * dt
      particle.life -= 0.02 * dt

      if (particle.life <= 0) {
        particle.active = false
        this.particlePool!.release(particle)
        continue
      }

      this.particles[activeCount++] = particle
    }

    this.particles.length = activeCount
  }

  getActiveParticles(): Particle[] {
    return this.particles
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
