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
  moveUp: [12], // D-pad up
  moveDown: [13], // D-pad down
  moveLeft: [14], // D-pad left
  moveRight: [15], // D-pad right
  shoot: [0, 7], // A button, Right trigger
  pause: [9], // Start button
  select: [0], // A button
  back: [1] // B button
}

class GamepadManager {
  private static instance: GamepadManager
  private connected: boolean = false
  private gamepadIndex: number = -1
  private buttonStates: Map<number, GamepadButton> = new Map()
  private deadzone: number = 0.2 // Increased for better control
  private axisStates: Map<number, number> = new Map()
  private activeKeys: Set<string> = new Set()
  private animationFrameId: number | null = null

  // Button debouncing
  private lastButtonPress: Map<number, number> = new Map()
  private buttonDebounceTime: number = 150 // ms

  // Analog stick smoothing
  private axisHistory: Map<number, number[]> = new Map()
  private axisHistorySize: number = 3

  // Polling rate control
  private lastUpdateTime: number = 0
  private updateInterval: number = 16 // ~60fps

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
      this.resetState()
      this.startPolling()
    })

    window.addEventListener('gamepaddisconnected', (e) => {
      console.log('🎮 Gamepad disconnected:', e.gamepad.id)
      this.connected = false
      this.gamepadIndex = -1
      this.resetState()
      this.stopPolling()
    })
  }

  private resetState(): void {
    this.buttonStates.clear()
    this.axisStates.clear()
    this.axisHistory.clear()
    this.lastButtonPress.clear()
    this.releaseAllKeys()
  }

  private startPolling(): void {
    if (this.animationFrameId) return

    const poll = (timestamp: number) => {
      // Throttle updates to prevent over-polling
      if (timestamp - this.lastUpdateTime >= this.updateInterval) {
        this.update()
        this.lastUpdateTime = timestamp
      }
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
      this.resetState()
      return
    }

    this.updateButtons(gamepad.buttons)
    this.updateAxes(gamepad.axes)
  }

  private updateButtons(buttons: readonly globalThis.GamepadButton[]): void {
    const now = Date.now()

    buttons.forEach((button, index) => {
      const prev = this.buttonStates.get(index)
      const lastPress = this.lastButtonPress.get(index) || 0

      // Button just pressed
      if (button.pressed && (!prev || !prev.pressed)) {
        // Check debounce for action buttons (not movement)
        if (
          !STANDARD_MAPPING.moveUp.includes(index) &&
          !STANDARD_MAPPING.moveDown.includes(index) &&
          !STANDARD_MAPPING.moveLeft.includes(index) &&
          !STANDARD_MAPPING.moveRight.includes(index)
        ) {
          if (now - lastPress < this.buttonDebounceTime) {
            return // Ignore rapid presses
          }
          this.lastButtonPress.set(index, now)
        }
        this.handleButtonPress(index)
      }

      // Button just released
      if (!button.pressed && prev && prev.pressed) {
        this.handleButtonRelease(index)
      }

      this.buttonStates.set(index, {
        pressed: button.pressed,
        value: button.value,
        timestamp: now
      })
    })
  }

  private updateAxes(axes: readonly number[]): void {
    // Left stick (primary movement)
    const leftX = axes[0] || 0
    const leftY = axes[1] || 0

    // Apply smoothing to reduce jitter
    const smoothedX = this.smoothAxis(0, leftX)
    const smoothedY = this.smoothAxis(1, leftY)

    // Apply deadzone with quadratic curve for better feel
    const deadzonedX = this.applyDeadzone(smoothedX)
    const deadzonedY = this.applyDeadzone(smoothedY)

    this.handleStickMovement(deadzonedX, deadzonedY)

    this.axisStates.set(0, deadzonedX)
    this.axisStates.set(1, deadzonedY)
  }

  private smoothAxis(axisIndex: number, value: number): number {
    if (!this.axisHistory.has(axisIndex)) {
      this.axisHistory.set(axisIndex, [])
    }

    const history = this.axisHistory.get(axisIndex)!
    history.push(value)

    if (history.length > this.axisHistorySize) {
      history.shift()
    }

    // Return average of recent values
    return history.reduce((sum, val) => sum + val, 0) / history.length
  }

  private applyDeadzone(value: number): number {
    if (Math.abs(value) < this.deadzone) {
      return 0
    }

    // Quadratic curve for smoother response
    const sign = value > 0 ? 1 : -1
    const normalized = (Math.abs(value) - this.deadzone) / (1 - this.deadzone)
    return sign * normalized
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
      this.simulateKeyUp('ArrowUp')
    } else if (STANDARD_MAPPING.moveDown.includes(buttonIndex)) {
      this.simulateKeyUp('ArrowDown')
    } else if (STANDARD_MAPPING.moveLeft.includes(buttonIndex)) {
      this.simulateKeyUp('ArrowLeft')
    } else if (STANDARD_MAPPING.moveRight.includes(buttonIndex)) {
      this.simulateKeyUp('ArrowRight')
    }
  }

  private handleStickMovement(x: number, y: number): void {
    // Use a lower threshold for stick input detection
    const threshold = 0.1

    // Determine which directions should be active based on stick position
    const shouldMoveUp = y < -threshold
    const shouldMoveDown = y > threshold
    const shouldMoveLeft = x < -threshold
    const shouldMoveRight = x > threshold

    // Handle vertical movement (using standard WASD for consistency)
    if (shouldMoveUp && !this.activeKeys.has('ArrowUp')) {
      this.simulateKeyDown('ArrowUp')
    } else if (!shouldMoveUp && this.activeKeys.has('ArrowUp')) {
      this.simulateKeyUp('ArrowUp')
    }

    if (shouldMoveDown && !this.activeKeys.has('ArrowDown')) {
      this.simulateKeyDown('ArrowDown')
    } else if (!shouldMoveDown && this.activeKeys.has('ArrowDown')) {
      this.simulateKeyUp('ArrowDown')
    }

    // Handle horizontal movement
    if (shouldMoveLeft && !this.activeKeys.has('ArrowLeft')) {
      this.simulateKeyDown('ArrowLeft')
    } else if (!shouldMoveLeft && this.activeKeys.has('ArrowLeft')) {
      this.simulateKeyUp('ArrowLeft')
    }

    if (shouldMoveRight && !this.activeKeys.has('ArrowRight')) {
      this.simulateKeyDown('ArrowRight')
    } else if (!shouldMoveRight && this.activeKeys.has('ArrowRight')) {
      this.simulateKeyUp('ArrowRight')
    }
  }

  private simulateKeyPress(key: string): void {
    this.simulateKeyDown(key)
    setTimeout(() => this.simulateKeyUp(key), 50)
  }

  private simulateKeyDown(key: string): void {
    if (this.activeKeys.has(key)) return

    this.activeKeys.add(key)

    // Create more realistic keyboard events
    const event = new KeyboardEvent('keydown', {
      key,
      code: this.getKeyCode(key),
      bubbles: true,
      cancelable: true,
      composed: true
    })

    window.dispatchEvent(event)
    document.dispatchEvent(event)
  }

  private simulateKeyUp(key: string): void {
    if (!this.activeKeys.has(key)) return

    this.activeKeys.delete(key)

    const event = new KeyboardEvent('keyup', {
      key,
      code: this.getKeyCode(key),
      bubbles: true,
      cancelable: true,
      composed: true
    })

    window.dispatchEvent(event)
    document.dispatchEvent(event)
  }

  private getKeyCode(key: string): string {
    const keyCodeMap: Record<string, string> = {
      ArrowUp: 'ArrowUp',
      ArrowDown: 'ArrowDown',
      ArrowLeft: 'ArrowLeft',
      ArrowRight: 'ArrowRight',
      ' ': 'Space',
      Escape: 'Escape',
      w: 'KeyW',
      s: 'KeyS',
      a: 'KeyA',
      d: 'KeyD'
    }
    return keyCodeMap[key] || key
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
    this.deadzone = Math.max(0.05, Math.min(0.5, value))
  }

  getDeadzone(): number {
    return this.deadzone
  }

  getAxisValue(axisIndex: number): number {
    return this.axisStates.get(axisIndex) || 0
  }

  isButtonPressed(buttonIndex: number): boolean {
    const state = this.buttonStates.get(buttonIndex)
    return state ? state.pressed : false
  }

  vibrate(
    duration: number = 200,
    weakMagnitude: number = 0.5,
    strongMagnitude: number = 0.5
  ): void {
    if (!this.connected || this.gamepadIndex < 0) return

    const gamepads = navigator.getGamepads()
    const gamepad = gamepads[this.gamepadIndex]

    if (gamepad && 'vibrationActuator' in gamepad && gamepad.vibrationActuator) {
      gamepad.vibrationActuator
        .playEffect('dual-rumble', {
          duration,
          weakMagnitude,
          strongMagnitude
        })
        .catch(() => {
          // Vibration not supported, silently fail
        })
    }
  }
}

export const gamepadManager = GamepadManager.getInstance()
