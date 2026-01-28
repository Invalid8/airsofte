import { particleSystem } from './particleSystem'
import { audioManager } from '../utils/AudioManager'
import { CONFIG } from '../config/performanceConfig'

export class EnhancedParticleEffects {
  static createPlayerTrail(x: number, y: number): void {
    for (let i = 0; i < CONFIG.trailParticles; i++) {
      particleSystem.createTrail(x + 40 + (Math.random() - 0.5) * 30, y + 140, '#00aaff')
      particleSystem.createTrail(x + 110 + (Math.random() - 0.5) * 30, y + 140, '#00aaff')
    }
  }

  static createEnemyTrail(x: number, y: number, width: number): void {
    particleSystem.createTrail(x + width / 2 + (Math.random() - 0.5) * 20, y, '#ff3300')
  }

  static createBigExplosion(x: number, y: number): void {
    particleSystem.createExplosion(x, y, CONFIG.explosionParticles, '#ff6600')

    const secondaryCount = Math.floor(CONFIG.explosionParticles / 2)
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        particleSystem.createExplosion(
          x + (Math.random() - 0.5) * 60,
          y + (Math.random() - 0.5) * 60,
          secondaryCount,
          '#ffaa00'
        )
      }, i * 100)
    }

    const sparkCount = Math.floor(CONFIG.explosionParticles / 3)
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        particleSystem.createExplosion(
          x + (Math.random() - 0.5) * 100,
          y + (Math.random() - 0.5) * 100,
          sparkCount,
          '#ffffff'
        )
      }, i * 50)
    }
  }

  static createPowerUpCollectEffect(x: number, y: number, type: string): void {
    const colors = {
      HEALTH: '#00ff88',
      WEAPON: '#ff6600',
      SHIELD: '#0088ff',
      SPEED: '#ffff00',
      SCORE: '#aa00ff'
    }

    const color = colors[type] || '#00ff88'
    const particleCount = CONFIG.explosionParticles

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount
      const speed = 3 + Math.random() * 2

      particleSystem.createExplosion(x, y, 1, color)

      setTimeout(() => {
        const particle = particleSystem['particlePool']!.acquire()
        particle.x = x
        particle.y = y
        particle.vx = Math.cos(angle) * speed
        particle.vy = Math.sin(angle) * speed
        particle.life = 1
        particle.maxLife = 1
        particle.size = 4
        particle.color = color
        particle.active = true
        particleSystem['particles'].push(particle)
      }, i * 10)
    }
  }

  static createShieldBreakEffect(x: number, y: number): void {
    const particleCount = CONFIG.explosionParticles
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount
      const speed = 4

      const particle = particleSystem['particlePool']!.acquire()
      particle.x = x
      particle.y = y
      particle.vx = Math.cos(angle) * speed
      particle.vy = Math.sin(angle) * speed
      particle.life = 1
      particle.maxLife = 1
      particle.size = 6
      particle.color = '#0088ff'
      particle.active = true
      particleSystem['particles'].push(particle)
    }
  }

  static createWarpEffect(x: number, y: number): void {
    const particleCount = CONFIG.explosionParticles * 2
    for (let i = 0; i < particleCount; i++) {
      setTimeout(() => {
        const angle = Math.random() * Math.PI * 2
        const distance = Math.random() * 100

        const particle = particleSystem['particlePool']!.acquire()
        particle.x = x + Math.cos(angle) * distance
        particle.y = y + Math.sin(angle) * distance
        particle.vx = -Math.cos(angle) * 3
        particle.vy = -Math.sin(angle) * 3
        particle.life = 1
        particle.maxLife = 1
        particle.size = 3
        particle.color = '#00aaff'
        particle.active = true
        particleSystem['particles'].push(particle)
      }, i * 10)
    }
  }

  static createBossDeathExplosion(x: number, y: number): void {
    const maxWaves = 4
    const particlesPerWave = CONFIG.explosionParticles / 2

    for (let wave = 0; wave < maxWaves; wave++) {
      setTimeout(() => {
        const radius = wave * 50
        const colors = ['#ff0000', '#ff6600', '#ffaa00', '#ffffff']
        const color = colors[wave % colors.length]

        for (let i = 0; i < particlesPerWave; i++) {
          const angle = (Math.PI * 2 * i) / particlesPerWave
          const px = x + Math.cos(angle) * radius
          const py = y + Math.sin(angle) * radius

          particleSystem.createExplosion(px, py, 8, color)
        }

        if (wave === 0 || wave === maxWaves - 1) {
          audioManager.playExplosion('large')
        }
      }, wave * 150)
    }

    setTimeout(() => {
      particleSystem.createExplosion(x, y, CONFIG.explosionParticles, '#ffffff')

      for (let i = 0; i < 15; i++) {
        setTimeout(() => {
          const angle = Math.random() * Math.PI * 2
          const distance = Math.random() * 150
          particleSystem.createExplosion(
            x + Math.cos(angle) * distance,
            y + Math.sin(angle) * distance,
            6,
            '#ffaa00'
          )
        }, i * 30)
      }
    }, maxWaves * 150)
  }

  static createBulletTrail(x: number, y: number, color: string = '#ffaa00'): void {
    if (Math.random() > 0.5) {
      const particle = particleSystem['particlePool']!.acquire()
      particle.x = x + (Math.random() - 0.5) * 5
      particle.y = y
      particle.vx = (Math.random() - 0.5) * 0.5
      particle.vy = 2
      particle.life = 0.5
      particle.maxLife = 0.5
      particle.size = 2
      particle.color = color
      particle.active = true
      particleSystem['particles'].push(particle)
    }
  }
}

export const enhancedParticles = EnhancedParticleEffects
