import type { BoundingBox } from '../types/gameTypes'

export function checkCollision(box1: BoundingBox, box2: BoundingBox): boolean {
  return (
    box1.x < box2.x + box2.width &&
    box1.x + box1.width > box2.x &&
    box1.y < box2.y + box2.height &&
    box1.y + box1.height > box2.y
  )
}

export function checkCircleCollision(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
): boolean {
  const dx = x2 - x1
  const dy = y2 - y1
  const distance = Math.sqrt(dx * dx + dy * dy)
  return distance < r1 + r2
}

export function getBoundingBox(x: number, y: number, width: number, height: number): BoundingBox {
  return { x, y, width, height }
}

export function getCircleBounds(x: number, y: number, radius: number): BoundingBox {
  return {
    x: x - radius,
    y: y - radius,
    width: radius * 2,
    height: radius * 2
  }
}

export function isPointInBox(px: number, py: number, box: BoundingBox): boolean {
  return px >= box.x && px <= box.x + box.width && py >= box.y && py <= box.y + box.height
}

export function clampToBox(
  x: number,
  y: number,
  objWidth: number,
  objHeight: number,
  container: BoundingBox
): { x: number; y: number } {
  return {
    x: Math.max(container.x, Math.min(x, container.x + container.width - objWidth)),
    y: Math.max(container.y, Math.min(y, container.y + container.height - objHeight))
  }
}

export class SpatialGrid {
  private cellSize: number
  private cols: number
  private rows: number
  private grid: Map<string, Set<{ id: string; box: BoundingBox; type: string }>>

  constructor(width: number, height: number, cellSize: number = 100) {
    this.cellSize = cellSize
    this.cols = Math.ceil(width / cellSize)
    this.rows = Math.ceil(height / cellSize)
    this.grid = new Map()
  }

  clear(): void {
    this.grid.clear()
  }

  private getCellKey(col: number, row: number): string {
    return `${col},${row}`
  }

  private getCellsForBox(box: BoundingBox): string[] {
    const startCol = Math.floor(box.x / this.cellSize)
    const endCol = Math.floor((box.x + box.width) / this.cellSize)
    const startRow = Math.floor(box.y / this.cellSize)
    const endRow = Math.floor((box.y + box.height) / this.cellSize)

    const cells: string[] = []
    for (let col = startCol; col <= endCol; col++) {
      for (let row = startRow; row <= endRow; row++) {
        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
          cells.push(this.getCellKey(col, row))
        }
      }
    }
    return cells
  }

  insert(id: string, box: BoundingBox, type: string): void {
    const cells = this.getCellsForBox(box)
    const obj = { id, box, type }

    cells.forEach((cellKey) => {
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, new Set())
      }
      this.grid.get(cellKey)!.add(obj)
    })
  }

  query(box: BoundingBox): Array<{ id: string; box: BoundingBox; type: string }> {
    const cells = this.getCellsForBox(box)
    const results = new Set<{ id: string; box: BoundingBox; type: string }>()

    cells.forEach((cellKey) => {
      const cell = this.grid.get(cellKey)
      if (cell) {
        cell.forEach((obj) => results.add(obj))
      }
    })

    return Array.from(results)
  }

  queryCollisions(
    box: BoundingBox,
    excludeId?: string
  ): Array<{ id: string; box: BoundingBox; type: string }> {
    const nearby = this.query(box)
    return nearby.filter((obj) => {
      if (excludeId && obj.id === excludeId) return false
      return checkCollision(box, obj.box)
    })
  }
}

export function checkBulletCollisions(
  bullets: Array<{
    id: string
    x: number
    y: number
    width: number
    height: number
    owner: string
  }>,
  targets: Array<{ id: string; x: number; y: number; width: number; height: number }>,
  targetOwner: string
): Array<{ bulletId: string; targetId: string }> {
  const collisions: Array<{ bulletId: string; targetId: string }> = []

  bullets.forEach((bullet) => {
    if (bullet.owner !== targetOwner) return

    const bulletBox = getBoundingBox(bullet.x, bullet.y, bullet.width, bullet.height)

    targets.forEach((target) => {
      const targetBox = getBoundingBox(target.x, target.y, target.width, target.height)

      if (checkCollision(bulletBox, targetBox)) {
        collisions.push({ bulletId: bullet.id, targetId: target.id })
      }
    })
  })

  return collisions
}
