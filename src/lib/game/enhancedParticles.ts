import type { PowerUpType } from '$lib/types/gameTypes'
import { particleSystem } from './particleSystem'
import { audioManager } from '$lib/utils/AudioManager'

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
    particleSystem.createExplosion(x, y, 28, '#ff6600')

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        particleSystem.createExplosion(
          x + (Math.random() - 0.5) * 60,
          y + (Math.random() - 0.5) * 60,
          12,
          '#ffaa00'
        )
      }, i * 100)
    }

    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        particleSystem.createExplosion(
          x + (Math.random() - 0.5) * 100,
          y + (Math.random() - 0.5) * 100,
          6,
          '#ffffff'
        )
      }, i * 50)
    }
  }

  static createPowerUpCollectEffect(x: number, y: number, type: PowerUpType | string): void {
    const colors: Record<PowerUpType, string> = {
      HEALTH: '#00ff88',
      WEAPON: '#ff6600',
      SHIELD: '#0088ff',
      SPEED: '#ffff00',
      SCORE: '#aa00ff'
    }

    const color = type in colors ? colors[type as PowerUpType] : '#00ff88'

    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30
      const speed = 3 + Math.random() * 2

      particleSystem.createExplosion(x, y, 1, color)

      setTimeout(() => {
        particleSystem.emitParticle({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 1,
          size: 4,
          color
        })
      }, i * 10)
    }
  }

  static createShieldBreakEffect(x: number, y: number): void {
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20
      const speed = 4

      particleSystem.emitParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        size: 6,
        color: '#0088ff'
      })
    }
  }

  static createWarpEffect(x: number, y: number): void {
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const angle = Math.random() * Math.PI * 2
        const distance = Math.random() * 100

        particleSystem.emitParticle({
          x: x + Math.cos(angle) * distance,
          y: y + Math.sin(angle) * distance,
          vx: -Math.cos(angle) * 3,
          vy: -Math.sin(angle) * 3,
          life: 1,
          maxLife: 1,
          size: 3,
          color: '#00aaff'
        })
      }, i * 10)
    }
  }

  static createBossDeathExplosion(x: number, y: number): void {
    const maxWaves = 3
    const particlesPerWave = 8

    for (let wave = 0; wave < maxWaves; wave++) {
      setTimeout(() => {
        const radius = wave * 50
        const colors = ['#ff0000', '#ff6600', '#ffaa00', '#ffffff']
        const color = colors[wave % colors.length]

        for (let i = 0; i < particlesPerWave; i++) {
          const angle = (Math.PI * 2 * i) / particlesPerWave
          const px = x + Math.cos(angle) * radius
          const py = y + Math.sin(angle) * radius

          particleSystem.createExplosion(px, py, 5, color)
        }

        if (wave === 0 || wave === maxWaves - 1) {
          audioManager.playExplosion('large')
        }
      }, wave * 150)
    }

    setTimeout(() => {
      particleSystem.createExplosion(x, y, 30, '#ffffff')

      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          const angle = Math.random() * Math.PI * 2
          const distance = Math.random() * 150
          particleSystem.createExplosion(
            x + Math.cos(angle) * distance,
            y + Math.sin(angle) * distance,
            4,
            '#ffaa00'
          )
        }, i * 30)
      }
    }, maxWaves * 150)
  }

  static createBulletTrail(x: number, y: number, color: string = '#ffaa00'): void {
    if (Math.random() > 0.5) {
      particleSystem.emitParticle({
        x: x + (Math.random() - 0.5) * 5,
        y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: 2,
        life: 0.5,
        maxLife: 0.5,
        size: 2,
        color
      })
    }
  }
}

export const enhancedParticles = EnhancedParticleEffects
