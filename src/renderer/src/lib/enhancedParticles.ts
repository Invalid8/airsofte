import { particleSystem, type Particle } from './particleSystem'

export class EnhancedParticleEffects {
  static createPlayerTrail(x: number, y: number): void {
    for (let i = 0; i < 2; i++) {
      particleSystem.createTrail(x + 40 + (Math.random() - 0.5) * 30, y + 140, '#00aaff')
      particleSystem.createTrail(x + 110 + (Math.random() - 0.5) * 30, y + 140, '#00aaff')
    }
  }

  static createEnemyTrail(x: number, y: number, width: number): void {
    particleSystem.createTrail(x + width / 2 + (Math.random() - 0.5) * 20, y, '#ff3300')
  }

  static createBigExplosion(x: number, y: number): void {
    particleSystem.createExplosion(x, y, 40, '#ff6600')

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        particleSystem.createExplosion(
          x + (Math.random() - 0.5) * 60,
          y + (Math.random() - 0.5) * 60,
          20,
          '#ffaa00'
        )
      }, i * 100)
    }

    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        particleSystem.createExplosion(
          x + (Math.random() - 0.5) * 100,
          y + (Math.random() - 0.5) * 100,
          10,
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

    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30
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
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20
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
    for (let i = 0; i < 50; i++) {
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
    for (let wave = 0; wave < 5; wave++) {
      setTimeout(() => {
        const radius = wave * 30
        const particleCount = 15 + wave * 5

        for (let i = 0; i < particleCount; i++) {
          const angle = (Math.PI * 2 * i) / particleCount
          const px = x + Math.cos(angle) * radius
          const py = y + Math.sin(angle) * radius

          particleSystem.createExplosion(px, py, 15, wave % 2 === 0 ? '#ff0000' : '#ffaa00')
        }
      }, wave * 150)
    }

    setTimeout(() => {
      particleSystem.createExplosion(x, y, 80, '#ffffff')
    }, 750)
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
