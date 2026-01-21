<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { gsap } from 'gsap'
  import PlayerShip from '../../assets/sprites/player-ship-i.png'
  import { PlayerController } from '../../lib/playerController'
  import { gameManager } from '../../utils/gameManager'
  import { gameEvents } from '../../lib/eventBus'
  import { getBoundingBox } from '../../utils/collisionSystem'
  import type { Bullet } from '../../types/gameTypes'

  let {
    game_pad,
    bullets = $bindable([]),
    x = $bindable(0),
    y = $bindable(0)
  }: {
    game_pad: HTMLDivElement
    bullets?: Bullet[]
    x?: number
    y?: number
  } = $props()

  let ship: HTMLImageElement
  let playerController: PlayerController
  let starting = true
  let idleTween: gsap.core.Tween | null = null
  let animationFrameId: number
  let isFlashing = false
  let keysPressed = $state<Set<string>>(new Set())

  const keys = {
    ArrowUp: () =>
      playerController?.move(
        'up',
        getBoundingBox(0, 0, game_pad.clientWidth, game_pad.clientHeight)
      ),
    ArrowDown: () =>
      playerController?.move(
        'down',
        getBoundingBox(0, 0, game_pad.clientWidth, game_pad.clientHeight)
      ),
    ArrowLeft: () =>
      playerController?.move(
        'left',
        getBoundingBox(0, 0, game_pad.clientWidth, game_pad.clientHeight)
      ),
    ArrowRight: () =>
      playerController?.move(
        'right',
        getBoundingBox(0, 0, game_pad.clientWidth, game_pad.clientHeight)
      ),
    w: () =>
      playerController?.move(
        'up',
        getBoundingBox(0, 0, game_pad.clientWidth, game_pad.clientHeight)
      ),
    s: () =>
      playerController?.move(
        'down',
        getBoundingBox(0, 0, game_pad.clientWidth, game_pad.clientHeight)
      ),
    a: () =>
      playerController?.move(
        'left',
        getBoundingBox(0, 0, game_pad.clientWidth, game_pad.clientHeight)
      ),
    d: () =>
      playerController?.move(
        'right',
        getBoundingBox(0, 0, game_pad.clientWidth, game_pad.clientHeight)
      )
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (starting || !gameManager.isPlaying || gameManager.isPaused) return

    keysPressed.add(event.key)
    keysPressed = new Set(keysPressed)

    if (event.key in keys) {
      event.preventDefault()

      if (idleTween) {
        idleTween.kill()
        idleTween = null
      }

      keys[event.key]()
      updateShipPosition()
    }

    if (event.key === ' ' || event.key === 'Space') {
      event.preventDefault()
    }
  }

  function handleKeyUp(event: KeyboardEvent): void {
    keysPressed.delete(event.key)
    keysPressed = new Set(keysPressed)
  }

  function updateShipPosition(): void {
    if (!playerController || !ship) return

    gsap.to(ship, {
      x: playerController.x,
      y: playerController.y,
      duration: 0.2,
      ease: 'power1.out',
      onComplete: () => {
        if (!idleTween && gameManager.isPlaying && !gameManager.isPaused) {
          idleTween = gsap.to(ship, {
            y: playerController.y + 10,
            duration: 1,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
          })
        }
      }
    })

    x = playerController.x
    y = playerController.y
  }

  function shoot(): void {
    if (!playerController) return

    const newBullets = playerController.shoot()
    if (newBullets.length > 0) {
      bullets = [...bullets, ...newBullets]
    }
  }

  function updateGame(): void {
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

    if (keysPressed.has('ArrowUp') || keysPressed.has('w')) {
      keys['w']()
      updateShipPosition()
    }
    if (keysPressed.has('ArrowDown') || keysPressed.has('s')) {
      keys['s']()
      updateShipPosition()
    }
    if (keysPressed.has('ArrowLeft') || keysPressed.has('a')) {
      keys['a']()
      updateShipPosition()
    }
    if (keysPressed.has('ArrowRight') || keysPressed.has('d')) {
      keys['d']()
      updateShipPosition()
    }

    bullets = bullets
      .filter((bullet) => {
        if (!bullet.active) return false

        bullet.x += bullet.vx || 0
        bullet.y += bullet.vy || -bullet.speed

        if (bullet.y < -30) {
          bullet.active = false
          return false
        }

        return true
      })
      .map((b) => ({ ...b }))

    animationFrameId = requestAnimationFrame(updateGame)
  }

  function handlePlayerHit(): void {
    if (!ship || isFlashing) return

    isFlashing = true
    const flashDuration = gameManager.player.invincible ? 2000 : 500

    gsap.to(ship, {
      opacity: 0.3,
      duration: 0.1,
      repeat: flashDuration / 200,
      yoyo: true,
      ease: 'none',
      onComplete: () => {
        gsap.set(ship, { opacity: 1 })
        isFlashing = false
      }
    })
  }

  function handlePlayerDeath(): void {
    if (!ship) return

    gsap.to(ship, {
      scale: 0,
      rotation: 360,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.in'
    })
  }

  function handlePlayerRespawn(): void {
    if (!ship || !playerController) return

    const centerX = (game_pad.clientWidth - playerController.width) / 2
    const startY = game_pad.clientHeight - playerController.height

    playerController.reset(centerX, startY - 80)

    gsap.set(ship, { scale: 0, opacity: 0 })
    gsap.to(ship, {
      scale: 1,
      opacity: 1,
      duration: 0.5,
      ease: 'back.out'
    })

    updateShipPosition()
  }

  let unsubHit: (() => void) | null = null
  let unsubDeath: (() => void) | null = null
  let unsubRespawn: (() => void) | null = null

  onMount(() => {
    if (!ship || !game_pad) return

    const centerX = (game_pad.clientWidth - 150) / 2
    const startY = game_pad.clientHeight - 150

    playerController = new PlayerController(centerX, startY)

    gsap.set(ship, { x: playerController.x, y: playerController.y })

    gsap.to(ship, {
      y: playerController.y - 80,
      duration: 2,
      ease: 'none',
      onUpdate: () => {
        playerController.y = gsap.getProperty(ship, 'y') as number
      },
      onComplete: () => {
        starting = false

        idleTween = gsap.to(ship, {
          y: playerController.y + 10,
          duration: 1,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut'
        })
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

<img
  bind:this={ship}
  class="ship absolute pointer-events-none"
  src={PlayerShip}
  alt="Player Ship"
  class:invincible={gameManager.player.invincible}
/>

{#each bullets as bullet (bullet.id)}
  <div
    class="bullet absolute pointer-events-none"
    style="left: {bullet.x}px; top: {bullet.y}px; width: {bullet.width}px; height: {bullet.height}px; margin: 0 1px;"
  ></div>
{/each}

<style>
  img.ship {
    width: 150px;
    height: auto;
    filter: drop-shadow(0 0 10px rgba(0, 170, 255, 0.5));
  }

  img.ship.invincible {
    filter: drop-shadow(0 0 20px rgba(0, 255, 255, 1));
  }

  .bullet {
    background: linear-gradient(to top, #ff7700, #ffaa00);
    border-radius: 50% 50% 0 0;
    box-shadow: 0 0 8px #ff9933;
  }
</style>
