<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { gsap } from 'gsap'
  import PlayerShip from '../../assets/sprites/player-ship-i.png'
  import { ShootSound1 } from '../../lib/sounds'

  export let game_pad: HTMLDivElement

  let ship: HTMLImageElement
  let starting = true
  let idleTween: gsap.core.Tween
  let x = 0
  let y = 0
  const moveStep = 20
  let bullets: Array<{ x: number; y: number; width: number; height: number; active: boolean }> = []
  const bulletSpeed = 10
  let canShoot = true
  const shootCoolDown = 150
  let animationFrameId: number
  let gameActive = true

  // Shooting modes
  let autoShoot = false
  let doubleShot = false
  let autoShootInterval: number

  // Performance monitoring
  let lastFrameTime = performance.now()
  let frameCount = 0
  let fps = 0
  let showPerformance = false

  const shootSound1 = ShootSound1()

  const keys = {
    ArrowUp: () => (y -= moveStep),
    ArrowLeft: () => (x -= moveStep),
    ArrowRight: () => (x += moveStep),
    ArrowDown: () => (y += moveStep),
    w: () => (y -= moveStep),
    a: () => (x -= moveStep),
    d: () => (x += moveStep),
    s: () => (y += moveStep)
  }

  function shoot(): void {
    if (!canShoot || !gameActive) return

    try {
      if (doubleShot) {
        const leftBullet = {
          x: x + 33,
          y: y + 35,
          width: 8,
          height: 25,
          active: true
        }

        const rightBullet = {
          x: x + ship.width - 37,
          y: y + 35,
          width: 8,
          height: 25,
          active: true
        }

        bullets = [...bullets, leftBullet, rightBullet]
      } else {
        const singleBullet = {
          x: x + ship.width / 2 - 5,
          y: y,
          width: 10,
          height: 30,
          active: true
        }

        bullets = [...bullets, singleBullet]
      }

      shootSound1.play()

      canShoot = false
      setTimeout(() => {
        canShoot = true
      }, shootCoolDown)
    } catch (error) {
      console.error('Error during shooting:', error)
      canShoot = true
    }
  }

  function toggleAutoShoot(): void {
    try {
      autoShoot = !autoShoot

      if (autoShoot) {
        if (autoShootInterval) clearInterval(autoShootInterval)

        autoShootInterval = Number(
          setInterval(() => {
            if (!starting && gameActive) shoot()
          }, shootCoolDown + 50)
        )
      } else {
        clearInterval(autoShootInterval)
      }
    } catch (error) {
      console.error('Error toggling auto shoot:', error)
      autoShoot = false
      if (autoShootInterval) clearInterval(autoShootInterval)
    }
  }

  function toggleDoubleShot(): void {
    doubleShot = !doubleShot
  }

  function togglePerformanceMonitor(): void {
    showPerformance = !showPerformance
  }

  function updateBullets(): void {
    if (!gameActive) return

    try {
      // Calculate FPS
      const now = performance.now()
      frameCount++

      if (now - lastFrameTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (now - lastFrameTime))
        frameCount = 0
        lastFrameTime = now

        // Auto-throttle if FPS drops too low
        if (fps < 30 && bullets.length > 30) {
          bullets = bullets.slice(-20) // Keep only the 20 most recent bullets
        }
      }

      // Limit maximum bullets to prevent performance issues
      if (bullets.length > 100) {
        bullets = bullets.slice(-75)
      }

      const updatedBullets = []

      for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i]
        bullet.y -= bulletSpeed

        if (bullet.y > -30) {
          // Only keep bullets that are still on screen or just above
          updatedBullets.push(bullet)
        }
      }

      bullets = updatedBullets
    } catch (error) {
      console.error('Error updating bullets:', error)
    }

    animationFrameId = requestAnimationFrame(updateBullets)
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (starting || !gameActive) return

    const pad: HTMLElement = game_pad || window.document.body

    try {
      if (event.key in keys) {
        if (idleTween) {
          idleTween.kill()
          idleTween = null
        }

        keys[event.key]()

        const bounds = pad?.getBoundingClientRect()
        if (!bounds) return

        x = Math.max(0, Math.min(x, bounds.width - (ship?.width || 150)))
        y = Math.max(0, Math.min(y, bounds.height - (ship?.height || 150)))

        gsap.to(ship, {
          x,
          y,
          duration: 0.2,
          ease: 'power1.out',
          onComplete: () => {
            if (!idleTween && gameActive) {
              idleTween = gsap.to(ship, {
                y: y + 10,
                duration: 1,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut'
              })
            }
          }
        })
      }

      if (event.key === ' ' || event.key === 'Space') {
        if (!autoShoot) shoot()
      }

      if (event.key === 'c' || event.key === 'C') {
        toggleAutoShoot()
      }

      if (event.key === 'v' || event.key === 'V') {
        toggleDoubleShot()
      }

      if (event.key === 'p' || event.key === 'P') {
        togglePerformanceMonitor()
      }
    } catch (error) {
      console.error('Error handling keydown:', error)
    }
  }

  onMount(() => {
    try {
      if (!ship) {
        console.error('Required elements not found')
        return
      }

      const pad: HTMLElement = game_pad || window.document.body

      const centerX = (pad.clientWidth - ship.clientWidth) / 2
      const startY = ship.clientHeight

      x = centerX
      y = startY

      gsap.set(ship, { x, y, rotate: 180 })

      gsap.to(ship, {
        y: y - 80,
        duration: 2,
        ease: 'none',
        onComplete: () => {
          y = y - 80
          starting = false

          idleTween = gsap.to(ship, {
            y: y + 10,
            duration: 1,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
          })
        }
      })

      // window.addEventListener('keydown', handleKeyDown)k

      // Start the game loop
      animationFrameId = requestAnimationFrame(updateBullets)

      // Add visibility change detection to pause when tab is inactive
      document.addEventListener('visibilitychange', handleVisibilityChange)
    } catch (error) {
      console.error('Error during initialization:', error)
    }
  })

  function handleVisibilityChange(): void {
    if (document.hidden) {
      // Pause game when tab is not visible
      gameActive = false
      if (autoShootInterval) clearInterval(autoShootInterval)
      if (idleTween) idleTween.pause()
      cancelAnimationFrame(animationFrameId)
    } else {
      // Resume game when tab becomes visible again
      gameActive = true
      if (autoShoot) toggleAutoShoot()
      if (idleTween) idleTween.resume()
      animationFrameId = requestAnimationFrame(updateBullets)
    }
  }

  onDestroy(() => {
    // Clean up all resources when component is destroyed
    gameActive = false
    window.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    cancelAnimationFrame(animationFrameId)
    clearInterval(autoShootInterval)
    if (idleTween) idleTween.kill()

    // Clear references
    bullets = []
  })
</script>

<img bind:this={ship} class="ship absolute" src={PlayerShip} alt="Player Ship" />

{#each bullets as bullet, i (i)}
  <div
    class="bullet absolute"
    style="left: {bullet.x}px; top: {bullet.y}px; width: {bullet.width}px; height: {bullet.height}px;"
  ></div>
{/each}

<div class="controls absolute top-4 right-4 text-white">
  <div>Mode: {autoShoot ? 'Auto' : 'Manual'} (Press C to toggle)</div>
  <div>Shot: {doubleShot ? 'Double' : 'Single'} (Press V to toggle)</div>
  {#if showPerformance}
    <div class="performance mt-2">
      <div>FPS: {fps}</div>
      <div>Bullets: {bullets.length}</div>
    </div>
  {/if}
  <div class="text-xs mt-1 opacity-75">Press P for performance stats</div>
</div>

<style>
  img.ship {
    width: 150px;
    height: auto;
  }

  .bullet {
    background-color: #ff7700;
    border-radius: 50% 50% 0 0;
    box-shadow: 0 0 8px #ff9933;
  }

  .controls {
    background-color: rgba(0, 0, 0, 0.5);
    padding: 8px;
    border-radius: 4px;
    font-size: 14px;
  }

  .performance {
    background-color: rgba(0, 0, 0, 0.7);
    padding: 4px 8px;
    border-radius: 4px;
    font-family: monospace;
  }
</style>
