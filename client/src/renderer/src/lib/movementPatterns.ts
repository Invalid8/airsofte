import type { Enemy, BoundingBox } from '../types/gameTypes'

export type TeleportState = {
  isTeleporting: boolean
  teleportProgress: number
  targetX: number
  targetY: number
  portalEffect: boolean
  lastTeleport: number
  teleportCooldown: number
}

export class MovementPatterns {
  static updateStraight(enemy: Enemy, deltaTime: number): void {
    enemy.y += enemy.speed * deltaTime
  }

  static updateWave(enemy: Enemy, deltaTime: number): void {
    enemy.y += enemy.speed * deltaTime
    if (enemy.patternData && enemy.patternData.startY !== undefined) {
      const progress = enemy.y - enemy.patternData.startY
      const offset =
        Math.sin(progress * enemy.patternData.frequency!) * enemy.patternData.amplitude!
      enemy.x = enemy.patternData.startX! + offset
    }
  }

  static updateZigzag(enemy: Enemy, deltaTime: number): void {
    enemy.y += enemy.speed * deltaTime
    if (enemy.patternData && enemy.patternData.startY !== undefined) {
      const progress = enemy.y - enemy.patternData.startY
      const zigzag = Math.floor(progress / 50) % 2 === 0 ? 1 : -1
      enemy.x = enemy.patternData.startX! + zigzag * enemy.patternData.amplitude!
    }
  }

  static updateCircle(
    enemy: Enemy,
    deltaTime: number,
    bounds?: BoundingBox,
    isBoss: boolean = false
  ): void {
    if (!enemy.patternData) return

    enemy.patternData.angle = (enemy.patternData.angle || 0) + 0.02 * deltaTime

    if (isBoss && bounds) {
      const centerX = bounds.width / 2 - enemy.width / 2
      const centerY = 150
      const radius = enemy.patternData.radius || 100

      enemy.x = centerX + Math.cos(enemy.patternData.angle) * radius
      enemy.y = centerY + Math.sin(enemy.patternData.angle) * 50
    } else {
      const centerX = enemy.patternData.startX || 0
      enemy.x = centerX + Math.cos(enemy.patternData.angle) * 100

      if (enemy.patternData.startY !== undefined) {
        enemy.patternData.startY += enemy.speed * deltaTime
        enemy.y = enemy.patternData.startY + Math.sin(enemy.patternData.angle) * 30
      }
    }
  }

  static updateChase(enemy: Enemy, deltaTime: number, playerX?: number, playerY?: number): void {
    if (playerX !== undefined && playerY !== undefined) {
      const dx = playerX - enemy.x
      const dy = playerY - enemy.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 0) {
        const isBoss = enemy.type === 'BOSS'
        const speedMultiplier = isBoss ? (distance < 300 ? 1.8 : 1.2) : 0.7

        enemy.x += (dx / distance) * enemy.speed * speedMultiplier * deltaTime
        enemy.y += (dy / distance) * enemy.speed * speedMultiplier * deltaTime
      }
    } else {
      enemy.y += enemy.speed * deltaTime
    }
  }

  static initializeTeleport(enemy: Enemy): void {
    if (!enemy.patternData) {
      enemy.patternData = {}
    }

    enemy.patternData.teleportState = {
      isTeleporting: false,
      teleportProgress: 0,
      targetX: enemy.x,
      targetY: enemy.y,
      portalEffect: false,
      lastTeleport: Date.now(),
      teleportCooldown: 3000 + Math.random() * 2000
    } as TeleportState
  }

  static updateTeleport(enemy: Enemy, deltaTime: number, bounds?: BoundingBox): void {
    if (!enemy.patternData?.teleportState) {
      this.initializeTeleport(enemy)
    }

    const teleportState = enemy.patternData!.teleportState as TeleportState
    const now = Date.now()

    if (teleportState.isTeleporting) {
      teleportState.teleportProgress += deltaTime / 600

      if (teleportState.teleportProgress < 0.5) {
        const fadeOut = 1 - teleportState.teleportProgress * 2
        enemy.patternData!.opacity = fadeOut
        enemy.patternData!.scale = 1 - teleportState.teleportProgress * 0.5
      } else if (teleportState.teleportProgress >= 0.5 && teleportState.teleportProgress < 1) {
        if (!teleportState.portalEffect) {
          enemy.x = teleportState.targetX
          enemy.y = teleportState.targetY
          teleportState.portalEffect = true
        }

        const fadeIn = (teleportState.teleportProgress - 0.5) * 2
        enemy.patternData!.opacity = fadeIn
        enemy.patternData!.scale = 0.5 + fadeIn * 0.5
      } else {
        teleportState.isTeleporting = false
        teleportState.portalEffect = false
        teleportState.teleportProgress = 0
        teleportState.lastTeleport = now
        enemy.patternData!.opacity = 1
        enemy.patternData!.scale = 1
      }
    } else {
      enemy.y += enemy.speed * 0.5 * deltaTime

      const timeSinceLastTeleport = now - teleportState.lastTeleport

      if (timeSinceLastTeleport >= teleportState.teleportCooldown && bounds) {
        const margin = 80
        const targetX = margin + Math.random() * (bounds.width - enemy.width - margin * 2)
        const targetY = enemy.y + (Math.random() * 100 - 50)

        teleportState.targetX = targetX
        teleportState.targetY = Math.max(0, Math.min(targetY, bounds.height - enemy.height))
        teleportState.isTeleporting = true
        teleportState.teleportProgress = 0
      }
    }
  }

  static updateSpiral(enemy: Enemy, deltaTime: number): void {
    if (!enemy.patternData) {
      enemy.patternData = {
        angle: 0,
        radius: 150,
        startX: enemy.x,
        startY: enemy.y
      }
    }

    enemy.patternData.angle = (enemy.patternData.angle || 0) + 0.05 * deltaTime
    enemy.patternData.radius = Math.max(20, (enemy.patternData.radius || 150) - 0.5 * deltaTime)

    const centerX = enemy.patternData.startX || enemy.x
    enemy.x = centerX + Math.cos(enemy.patternData.angle) * enemy.patternData.radius
    enemy.y += enemy.speed * deltaTime
  }

  static updateDiagonal(
    enemy: Enemy,
    deltaTime: number,
    direction: 'left' | 'right' = 'right'
  ): void {
    const horizontalSpeed = enemy.speed * 0.7
    enemy.y += enemy.speed * deltaTime
    enemy.x += (direction === 'right' ? horizontalSpeed : -horizontalSpeed) * deltaTime
  }
}

export function getMovementUpdater(pattern: string) {
  switch (pattern) {
    case 'STRAIGHT':
      return MovementPatterns.updateStraight
    case 'WAVE':
      return MovementPatterns.updateWave
    case 'ZIGZAG':
      return MovementPatterns.updateZigzag
    case 'CIRCLE':
      return MovementPatterns.updateCircle
    case 'CHASE':
      return MovementPatterns.updateChase
    case 'TELEPORT':
      return MovementPatterns.updateTeleport
    case 'SPIRAL':
      return MovementPatterns.updateSpiral
    case 'DIAGONAL':
      return MovementPatterns.updateDiagonal
    default:
      return MovementPatterns.updateStraight
  }
}
