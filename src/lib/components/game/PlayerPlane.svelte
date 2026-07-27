<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { gsap } from 'gsap'
  import { PlayerController } from '$lib/game/playerController'
  import { gameManager } from '$lib/game/gameManager'
  import { gameEvents } from '$lib/game/eventBus'
  import { GAME_CONFIG } from '$lib/config/gameConstants'
  import { getBoundingBox } from '$lib/utils/collisionSystem'
  import type { Bullet } from '$lib/types/gameTypes'

  let {
    game_pad,
    bullets = $bindable([]),
    x = $bindable(0),
    y = $bindable(0),
    opacity = $bindable(1),
    scale = $bindable(1),
    rotation = $bindable(0),
    offsetY = $bindable(0),
    invincible = $bindable(false)
  }: {
    game_pad: HTMLDivElement
    bullets?: Bullet[]
    x?: number
    y?: number
    opacity?: number
    scale?: number
    rotation?: number
    offsetY?: number
    invincible?: boolean
  } = $props()

  let playerController: PlayerController
  let starting = true
  let idleTween: gsap.core.Tween | null = null
  let animationFrameId: number
  let lastFrameTime = 0
  let isFlashing = false
  let keysPressed = $state<Set<string>>(new Set())
  const movementKeys = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'])

  function handleKeyDown(event: KeyboardEvent): void {
    if (starting || !gameManager.isPlaying || gameManager.isPaused) return

    keysPressed.add(event.key)
    keysPressed = new Set(keysPressed)

    if (movementKeys.has(event.key)) {
      event.preventDefault()
    }

    if (event.key === ' ' || event.key === 'Space') {
      event.preventDefault()
    }
  }

  function handleKeyUp(event: KeyboardEvent): void {
    keysPressed.delete(event.key)
    keysPressed = new Set(keysPressed)

    if (!hasMovementInput()) {
      startIdleTween()
    }
  }

  function hasMovementInput(): boolean {
    for (const key of movementKeys) {
      if (keysPressed.has(key)) return true
    }
    return false
  }

  function stopIdleTween(): void {
    if (!idleTween) return
    idleTween.kill()
    idleTween = null
    offsetY = 0
  }

  function startIdleTween(): void {
    if (
      idleTween ||
      !playerController ||
      starting ||
      !gameManager.isPlaying ||
      gameManager.isPaused
    ) {
      return
    }

    const visual = { offsetY }
    idleTween = gsap.to(visual, {
      offsetY: 10,
      duration: 1,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
      onUpdate: () => {
        offsetY = visual.offsetY
      }
    })
  }

  function updateShipPosition(): void {
    if (!playerController) return

    x = playerController.x
    y = playerController.y
    invincible = gameManager.player.invincible || gameManager.player.shieldActive
  }

  function shoot(): void {
    if (!playerController) return

    const newBullets = playerController.shoot()
    if (newBullets.length > 0) {
      bullets = [...bullets, ...newBullets]
    }
  }

  function updateGame(now: number): void {
    const deltaMs = lastFrameTime ? Math.min(50, now - lastFrameTime) : GAME_CONFIG.FRAME_TIME
    const deltaScale = deltaMs / GAME_CONFIG.FRAME_TIME
    lastFrameTime = now

    if (!gameManager.isPlaying) {
      animationFrameId = requestAnimationFrame(updateGame)
      return
    }

    if (gameManager.isPaused) {
      animationFrameId = requestAnimationFrame(updateGame)
      return
    }

    if (keysPressed.has(' ') || keysPressed.has('Space')) {
      shoot()
    }

    invincible = gameManager.player.invincible || gameManager.player.shieldActive

    let inputX = 0
    let inputY = 0
    const bounds = getBoundingBox(0, 0, game_pad.clientWidth, game_pad.clientHeight)

    if (keysPressed.has('ArrowUp') || keysPressed.has('w')) {
      inputY -= 1
    }
    if (keysPressed.has('ArrowDown') || keysPressed.has('s')) {
      inputY += 1
    }
    if (keysPressed.has('ArrowLeft') || keysPressed.has('a')) {
      inputX -= 1
    }
    if (keysPressed.has('ArrowRight') || keysPressed.has('d')) {
      inputX += 1
    }

    const moved = inputX !== 0 || inputY !== 0
    if (moved) {
      playerController?.moveBy(inputX, inputY, bounds, deltaScale)
    }

    if (moved) {
      stopIdleTween()
      updateShipPosition()
    } else {
      startIdleTween()
    }

    let activeBulletCount = 0
    for (const bullet of bullets) {
      if (!bullet.active) {
        playerController?.releaseBullet(bullet)
        continue
      }

      bullet.x += (bullet.vx || 0) * deltaScale
      bullet.y += (bullet.vy || -bullet.speed) * deltaScale

      if (bullet.y < -30) {
        bullet.active = false
        playerController?.releaseBullet(bullet)
        continue
      }

      bullets[activeBulletCount++] = bullet
    }
    bullets.length = activeBulletCount
    bullets = bullets

    animationFrameId = requestAnimationFrame(updateGame)
  }

  function handlePlayerHit(): void {
    if (isFlashing) return

    isFlashing = true
    const flashDuration = gameManager.player.invincible ? 2000 : 500
    const visual = { opacity }

    gsap.to(visual, {
      opacity: 0.3,
      duration: 0.1,
      repeat: flashDuration / 200,
      yoyo: true,
      ease: 'none',
      onUpdate: () => {
        opacity = visual.opacity
      },
      onComplete: () => {
        opacity = 1
        isFlashing = false
      }
    })
  }

  function handlePlayerDeath(): void {
    const visual = { scale, rotation, opacity }

    gsap.to(visual, {
      scale: 0,
      rotation: 360,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.in',
      onUpdate: () => {
        scale = visual.scale
        rotation = visual.rotation
        opacity = visual.opacity
      }
    })
  }

  function handlePlayerRespawn(): void {
    if (!playerController) return

    const centerX = (game_pad.clientWidth - playerController.width) / 2
    const startY = game_pad.clientHeight - playerController.height

    playerController.reset(centerX, startY - 80)

    const visual = { scale: 0, opacity: 0, rotation: 0 }
    scale = 0
    opacity = 0
    rotation = 0

    gsap.to(visual, {
      scale: 1,
      opacity: 1,
      duration: 0.5,
      ease: 'back.out',
      onUpdate: () => {
        scale = visual.scale
        opacity = visual.opacity
      }
    })

    updateShipPosition()
  }

  let unsubHit: (() => void) | null = null
  let unsubDeath: (() => void) | null = null
  let unsubRespawn: (() => void) | null = null

  onMount(() => {
    if (!game_pad) return

    const centerX = (game_pad.clientWidth - 150) / 2
    const startY = game_pad.clientHeight - 150

    playerController = new PlayerController(centerX, startY)
    x = playerController.x
    y = playerController.y
    opacity = 1
    scale = 1
    rotation = 0
    offsetY = 0
    invincible = gameManager.player.invincible || gameManager.player.shieldActive

    const spawn = { y: playerController.y }
    gsap.to(spawn, {
      y: startY - 80,
      duration: 2,
      ease: 'none',
      onUpdate: () => {
        playerController.y = spawn.y
        updateShipPosition()
      },
      onComplete: () => {
        starting = false
        startIdleTween()
      }
    })

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    animationFrameId = requestAnimationFrame(updateGame)

    unsubHit = gameEvents.on('PLAYER_HIT', handlePlayerHit)
    unsubDeath = gameEvents.on('PLAYER_DEATH', handlePlayerDeath)
    unsubRespawn = gameEvents.on('PLAYER_RESPAWN', handlePlayerRespawn)
  })

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
    if (idleTween) idleTween.kill()
    if (unsubHit) unsubHit()
    if (unsubDeath) unsubDeath()
    if (unsubRespawn) unsubRespawn()
  })
</script>
