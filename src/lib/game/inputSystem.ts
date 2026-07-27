import { gameManager } from '$lib/game/gameManager'

export type MovementVector = {
  x: number
  y: number
}

export class RuntimeInputSystem {
  private keysPressed = new Set<string>()
  private bound = false

  private readonly movementKeys = new Set([
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'w',
    'a',
    's',
    'd'
  ])

  bind(): void {
    if (this.bound) return
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    this.bound = true
  }

  unbind(): void {
    if (!this.bound) return
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    this.keysPressed.clear()
    this.bound = false
  }

  isShooting(): boolean {
    return this.keysPressed.has(' ') || this.keysPressed.has('Space')
  }

  getMovementVector(): MovementVector {
    let x = 0
    let y = 0

    if (this.keysPressed.has('ArrowUp') || this.keysPressed.has('w')) y -= 1
    if (this.keysPressed.has('ArrowDown') || this.keysPressed.has('s')) y += 1
    if (this.keysPressed.has('ArrowLeft') || this.keysPressed.has('a')) x -= 1
    if (this.keysPressed.has('ArrowRight') || this.keysPressed.has('d')) x += 1

    return { x, y }
  }

  hasMovementInput(): boolean {
    for (const key of this.movementKeys) {
      if (this.keysPressed.has(key)) return true
    }
    return false
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!gameManager.isPlaying || gameManager.isPaused) return

    this.keysPressed.add(event.key)

    if (this.movementKeys.has(event.key) || event.key === ' ' || event.key === 'Space') {
      event.preventDefault()
    }
  }

  private handleKeyUp = (event: KeyboardEvent): void => {
    this.keysPressed.delete(event.key)
  }
}
