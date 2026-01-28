type GamepadButton = {
  pressed: boolean
  value: number
  timestamp: number
}

type GamepadMapping = {
  moveUp: number[]
  moveDown: number[]
  moveLeft: number[]
  moveRight: number[]
  shoot: number[]
  pause: number[]
  select: number[]
  back: number[]
}

const STANDARD_MAPPING: GamepadMapping = {
  moveUp: [12],
  moveDown: [13],
  moveLeft: [14],
  moveRight: [15],
  shoot: [0, 7],
  pause: [9],
  select: [0],
  back: [1]
}

class GamepadManager {
  private static instance: GamepadManager
  private connected: boolean = false
  private gamepadIndex: number = -1
  private buttonStates: Map<number, GamepadButton> = new Map()
  private deadzone: number = 0.15
  private axisStates: Map<number, number> = new Map()
  private activeKeys: Set<string> = new Set()
  private animationFrameId: number | null = null

  private constructor() {
    this.setupEventListeners()
  }

  static getInstance(): GamepadManager {
    if (!GamepadManager.instance) {
      GamepadManager.instance = new GamepadManager()
    }
    return GamepadManager.instance
  }

  private setupEventListeners(): void {
    window.addEventListener('gamepadconnected', (e) => {
      console.log('🎮 Gamepad connected:', e.gamepad.id)
      this.connected = true
      this.gamepadIndex = e.gamepad.index
      this.startPolling()
    })

    window.addEventListener('gamepaddisconnected', (e) => {
      console.log('🎮 Gamepad disconnected:', e.gamepad.id)
      this.connected = false
      this.gamepadIndex = -1
      this.buttonStates.clear()
      this.axisStates.clear()
      this.releaseAllKeys()
      this.stopPolling()
    })
  }

  private startPolling(): void {
    if (this.animationFrameId) return

    const poll = () => {
      this.update()
      this.animationFrameId = requestAnimationFrame(poll)
    }

    this.animationFrameId = requestAnimationFrame(poll)
  }

  private stopPolling(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  update(): void {
    if (!this.connected || this.gamepadIndex < 0) return

    const gamepads = navigator.getGamepads()
    const gamepad = gamepads[this.gamepadIndex]

    if (!gamepad) {
      this.connected = false
      return
    }

    this.updateButtons(gamepad.buttons as any)
    this.updateAxes(gamepad.axes)
  }

  private updateButtons(buttons: readonly GamepadButton[]): void {
    buttons.forEach((button, index) => {
      const prev = this.buttonStates.get(index)

      if (button.pressed && (!prev || !prev.pressed)) {
        this.handleButtonPress(index)
      }

      if (!button.pressed && prev && prev.pressed) {
        this.handleButtonRelease(index)
      }

      this.buttonStates.set(index, {
        pressed: button.pressed,
        value: button.value,
        timestamp: Date.now()
      })
    })
  }

  private updateAxes(axes: readonly number[]): void {
    const leftX = axes[0] || 0
    const leftY = axes[1] || 0

    const deadzonedX = Math.abs(leftX) > this.deadzone ? leftX : 0
    const deadzonedY = Math.abs(leftY) > this.deadzone ? leftY : 0

    this.handleStickMovement(deadzonedX, deadzonedY)

    this.axisStates.set(0, deadzonedX)
    this.axisStates.set(1, deadzonedY)
  }

  private handleButtonPress(buttonIndex: number): void {
    if (STANDARD_MAPPING.shoot.includes(buttonIndex)) {
      this.simulateKeyPress(' ')
    } else if (STANDARD_MAPPING.pause.includes(buttonIndex)) {
      this.simulateKeyPress('Escape')
    } else if (STANDARD_MAPPING.moveUp.includes(buttonIndex)) {
      this.simulateKeyDown('ArrowUp')
    } else if (STANDARD_MAPPING.moveDown.includes(buttonIndex)) {
      this.simulateKeyDown('ArrowDown')
    } else if (STANDARD_MAPPING.moveLeft.includes(buttonIndex)) {
      this.simulateKeyDown('ArrowLeft')
    } else if (STANDARD_MAPPING.moveRight.includes(buttonIndex)) {
      this.simulateKeyDown('ArrowRight')
    }
  }

  private handleButtonRelease(buttonIndex: number): void {
    if (STANDARD_MAPPING.moveUp.includes(buttonIndex)) {
      this.simulateKeyUp('w')
    } else if (STANDARD_MAPPING.moveDown.includes(buttonIndex)) {
      this.simulateKeyUp('s')
    } else if (STANDARD_MAPPING.moveLeft.includes(buttonIndex)) {
      this.simulateKeyUp('a')
    } else if (STANDARD_MAPPING.moveRight.includes(buttonIndex)) {
      this.simulateKeyUp('d')
    }
  }

  private handleStickMovement(x: number, y: number): void {
    const threshold = this.deadzone

    // Determine which directions should be active
    const shouldMoveUp = y < -threshold
    const shouldMoveDown = y > threshold
    const shouldMoveLeft = x < -threshold
    const shouldMoveRight = x > threshold

    // Handle vertical movement
    if (shouldMoveUp && !this.activeKeys.has('w')) {
      this.simulateKeyDown('w')
    } else if (!shouldMoveUp && this.activeKeys.has('w')) {
      this.simulateKeyUp('w')
    }

    if (shouldMoveDown && !this.activeKeys.has('s')) {
      this.simulateKeyDown('s')
    } else if (!shouldMoveDown && this.activeKeys.has('s')) {
      this.simulateKeyUp('s')
    }

    // Handle horizontal movement
    if (shouldMoveLeft && !this.activeKeys.has('a')) {
      this.simulateKeyDown('a')
    } else if (!shouldMoveLeft && this.activeKeys.has('a')) {
      this.simulateKeyUp('a')
    }

    if (shouldMoveRight && !this.activeKeys.has('d')) {
      this.simulateKeyDown('d')
    } else if (!shouldMoveRight && this.activeKeys.has('d')) {
      this.simulateKeyUp('d')
    }
  }

  private simulateKeyPress(key: string): void {
    this.simulateKeyDown(key)
    setTimeout(() => this.simulateKeyUp(key), 50)
  }

  private simulateKeyDown(key: string): void {
    if (this.activeKeys.has(key)) return

    this.activeKeys.add(key)
    const event = new KeyboardEvent('keydown', {
      key,
      code: key,
      bubbles: true,
      cancelable: true
    })
    window.dispatchEvent(event)
  }

  private simulateKeyUp(key: string): void {
    if (!this.activeKeys.has(key)) return

    this.activeKeys.delete(key)
    const event = new KeyboardEvent('keyup', {
      key,
      code: key,
      bubbles: true,
      cancelable: true
    })
    window.dispatchEvent(event)
  }

  private releaseAllKeys(): void {
    this.activeKeys.forEach((key) => {
      this.simulateKeyUp(key)
    })
    this.activeKeys.clear()
  }

  isConnected(): boolean {
    return this.connected
  }

  getGamepadInfo(): string | null {
    if (!this.connected || this.gamepadIndex < 0) return null

    const gamepads = navigator.getGamepads()
    const gamepad = gamepads[this.gamepadIndex]
    return gamepad ? gamepad.id : null
  }

  setDeadzone(value: number): void {
    this.deadzone = Math.max(0, Math.min(1, value))
  }

  getDeadzone(): number {
    return this.deadzone
  }
}

export const gamepadManager = GamepadManager.getInstance()
