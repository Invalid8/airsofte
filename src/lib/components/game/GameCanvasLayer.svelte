<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type { Bullet, Enemy, PowerUp } from '$lib/types/gameTypes'
  import { gameManager } from '$lib/game/gameManager'
  import { GAME_CONFIG } from '$lib/config/gameConstants'
  import { particleSystem } from '$lib/game/particleSystem'
  import PlayerShip from '$lib/assets/sprites/player-ship-i.png'
  import EnemyBasic from '$lib/assets/sprites/enemy-basic.png'
  import EnemyScout from '$lib/assets/sprites/enemy-scout.png'
  import EnemyBomber from '$lib/assets/sprites/enemy-bomber.png'
  import BossShip from '$lib/assets/sprites/boss-1.png'
  import PowerUpHealth from '$lib/assets/sprites/powerup-health.png'
  import PowerUpWeapon from '$lib/assets/sprites/powerup-weapon.png'
  import PowerUpShield from '$lib/assets/sprites/powerup-shield.png'
  import PowerUpSpeed from '$lib/assets/sprites/powerup-speed.png'
  import PowerUpScore from '$lib/assets/sprites/powerup-score.png'

  let {
    game_pad,
    playerBullets = [],
    enemyBullets = [],
    enemies = [],
    powerUps = [],
    playerX = 0,
    playerY = 0,
    playerOpacity = 1,
    playerScale = 1,
    playerRotation = 0,
    playerOffsetY = 0,
    playerInvincible = false
  }: {
    game_pad: HTMLDivElement
    playerBullets?: Bullet[]
    enemyBullets?: Bullet[]
    enemies?: Enemy[]
    powerUps?: PowerUp[]
    playerX?: number
    playerY?: number
    playerOpacity?: number
    playerScale?: number
    playerRotation?: number
    playerOffsetY?: number
    playerInvincible?: boolean
  } = $props()

  type Star = {
    x: number
    y: number
    size: number
    speed: number
    color: string
    alpha: number
  }

  let canvas: HTMLCanvasElement | undefined
  let ctx: CanvasRenderingContext2D | null = null
  let resizeObserver: ResizeObserver | null = null
  let animationFrameId = 0
  let width = 0
  let height = 0
  let lastFrame = 0
  let stars: Star[] = []

  const images = new Map<string, HTMLImageElement>()
  const imageSources = {
    player: PlayerShip,
    BASIC: EnemyBasic,
    SCOUT: EnemyScout,
    BOMBER: EnemyBomber,
    BOSS: BossShip,
    HEALTH: PowerUpHealth,
    WEAPON: PowerUpWeapon,
    SHIELD: PowerUpShield,
    SPEED: PowerUpSpeed,
    SCORE: PowerUpScore
  }

  function loadImages(): void {
    Object.entries(imageSources).forEach(([key, src]) => {
      const image = new Image()
      image.decoding = 'async'
      image.src = src
      images.set(key, image)
    })
  }

  function resizeCanvas(): void {
    if (!canvas || !game_pad) return

    const nextWidth = game_pad.clientWidth
    const nextHeight = game_pad.clientHeight
    const dpr = Math.max(1, window.devicePixelRatio || 1)

    width = nextWidth
    height = nextHeight
    canvas.width = Math.round(nextWidth * dpr)
    canvas.height = Math.round(nextHeight * dpr)
    canvas.style.width = `${nextWidth}px`
    canvas.style.height = `${nextHeight}px`

    ctx = canvas.getContext('2d', { alpha: true })
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
    createStars()
  }

  function createStars(): void {
    const count = Math.max(120, Math.floor((width * height) / 9000))
    stars = Array.from({ length: count }, (_, index) => {
      const size = index % 9 === 0 ? 2.4 : index % 4 === 0 ? 1.7 : 1
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size,
        speed: 10 + size * 18 + Math.random() * 18,
        color: index % 11 === 0 ? '#64d8ff' : '#ffffff',
        alpha: 0.35 + Math.random() * 0.6
      }
    })
  }

  function drawBackground(delta: number): void {
    if (!ctx) return

    ctx.save()
    for (const star of stars) {
      star.y += star.speed * delta
      if (star.y > height + 8) {
        star.y = -8
        star.x = Math.random() * width
      }

      ctx.globalAlpha = star.alpha
      ctx.fillStyle = star.color
      ctx.shadowColor = star.color
      ctx.shadowBlur = star.size * 3
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()

  }

  function drawImageWithGlow(
    image: HTMLImageElement | undefined,
    x: number,
    y: number,
    w: number,
    h: number,
    glow: string,
    shadowBlur: number,
    rotation = 0,
    scale = 1,
    opacity = 1
  ): void {
    if (!ctx || !image || !image.complete) return

    ctx.save()
    ctx.globalAlpha = opacity
    ctx.translate(x + w / 2, y + h / 2)
    ctx.rotate(rotation)
    ctx.scale(scale, scale)
    ctx.shadowColor = glow
    ctx.shadowBlur = shadowBlur
    ctx.drawImage(image, -w / 2, -h / 2, w, h)
    ctx.restore()
  }

  function drawProjectile(
    bullet: Bullet,
    color: string,
    glow: string,
    capDirection: 'up' | 'down'
  ): void {
    if (!ctx || !bullet.active) return

    const radius = Math.min(bullet.width / 2, 5)
    const topRadius = capDirection === 'up' ? radius : 2
    const bottomRadius = capDirection === 'down' ? radius : 2
    const { x, y, width: w, height: h } = bullet

    ctx.save()
    ctx.shadowColor = glow
    ctx.shadowBlur = 8
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(x + topRadius, y)
    ctx.lineTo(x + w - topRadius, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + topRadius)
    ctx.lineTo(x + w, y + h - bottomRadius)
    ctx.quadraticCurveTo(x + w, y + h, x + w - bottomRadius, y + h)
    ctx.lineTo(x + bottomRadius, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - bottomRadius)
    ctx.lineTo(x, y + topRadius)
    ctx.quadraticCurveTo(x, y, x + topRadius, y)
    ctx.fill()
    ctx.restore()
  }

  function drawPowerUp(powerUp: PowerUp, now: number): void {
    const image = images.get(powerUp.type)
    const bob = Math.sin(now / 240 + powerUp.x) * 6
    const rotation = now / 600
    drawImageWithGlow(
      image,
      powerUp.x,
      powerUp.y + bob,
      powerUp.width,
      powerUp.height,
      '#00ff88',
      18,
      rotation
    )
  }

  function drawEnemy(enemy: Enemy, now: number): void {
    if (!ctx || !enemy.active) return

    const image = images.get(enemy.type)
    const opacity = enemy.patternData?.opacity ?? 1
    const scale = enemy.patternData?.scale ?? 1
    const healthPercent = enemy.health / enemy.maxHealth
    const glow =
      enemy.pattern === 'TELEPORT' && enemy.patternData?.teleportState?.isTeleporting
        ? '#00aaff'
        : healthPercent < 0.6
          ? '#ff5500'
          : '#ff2222'

    if (healthPercent < 1) {
      drawEnemyDamageGlow(enemy, image, healthPercent, glow, now)
    }

    if (enemy.pattern === 'TELEPORT' && enemy.patternData?.teleportState?.isTeleporting) {
      ctx.save()
      ctx.globalAlpha = 0.45
      ctx.strokeStyle = '#00aaff'
      ctx.shadowColor = '#00aaff'
      ctx.shadowBlur = 18
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width * 0.55, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }

    drawImageWithGlow(
      image,
      enemy.x,
      enemy.y,
      enemy.width,
      enemy.height,
      glow,
      healthPercent < 0.6 ? 18 : 10,
      Math.PI,
      scale,
      opacity
    )

    if (enemy.type === 'BOSS') {
      drawBossHealthBar(enemy, now)
    }
  }

  function drawEnemyDamageGlow(
    enemy: Enemy,
    image: HTMLImageElement | undefined,
    healthPercent: number,
    glow: string,
    now: number
  ): void {
    if (!ctx) return

    const centerX = enemy.x + enemy.width / 2
    const centerY = enemy.y + enemy.height / 2
    const damage = 1 - healthPercent
    const pulse = 0.5 + Math.sin(now / 150 + enemy.x) * 0.5
    const scale = 1.04 + damage * 0.08 + pulse * 0.02

    if (image?.complete) {
      ctx.save()
      ctx.globalAlpha = 0.16 + damage * 0.24 + pulse * 0.05
      ctx.shadowColor = glow
      ctx.shadowBlur = 28 + damage * 28
      ctx.filter = `drop-shadow(0 0 ${10 + damage * 18}px ${glow})`
      ctx.translate(centerX, centerY)
      ctx.scale(scale, scale)
      ctx.rotate(Math.PI)
      ctx.drawImage(image, -enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height)
      ctx.restore()
    }

    const radiusX = enemy.width * (0.52 + damage * 0.12)
    const radiusY = enemy.height * (0.48 + damage * 0.1)

    ctx.save()
    ctx.globalAlpha = 0.07 + damage * 0.13 + pulse * 0.03
    ctx.shadowColor = glow
    ctx.shadowBlur = 20 + damage * 18

    const gradient = ctx.createRadialGradient(centerX, centerY, 4, centerX, centerY, radiusX)
    gradient.addColorStop(0, glow === '#ff5500' ? 'rgba(255, 85, 0, 0.14)' : 'rgba(255, 34, 34, 0.12)')
    gradient.addColorStop(0.58, glow === '#ff5500' ? 'rgba(255, 85, 0, 0.08)' : 'rgba(255, 34, 34, 0.07)')
    gradient.addColorStop(1, 'rgba(255, 34, 34, 0)')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  function drawBossHealthBar(enemy: Enemy, now: number): void {
    if (!ctx) return

    const healthPercent = Math.max(0, Math.min(1, enemy.health / enemy.maxHealth))
    const barWidth = Math.min(360, Math.max(180, enemy.width * 1.25))
    const barHeight = 14
    const x = Math.max(16, Math.min(width - barWidth - 16, enemy.x + enemy.width / 2 - barWidth / 2))
    const y = Math.max(18, enemy.y - 28)
    const phaseColor =
      healthPercent > 0.66 ? '#ff2a2a' : healthPercent > 0.33 ? '#ffaa22' : '#ff0000'
    const pulse = 0.5 + Math.sin(now / 130) * 0.5

    ctx.save()
    ctx.shadowColor = phaseColor
    ctx.shadowBlur = 12 + pulse * 8
    ctx.fillStyle = 'rgba(0, 0, 0, 0.78)'
    ctx.strokeStyle = phaseColor
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(x, y, barWidth, barHeight, 4)
    ctx.fill()
    ctx.stroke()

    ctx.shadowBlur = 10
    ctx.fillStyle = phaseColor
    ctx.beginPath()
    ctx.roundRect(x + 3, y + 3, Math.max(0, (barWidth - 6) * healthPercent), barHeight - 6, 3)
    ctx.fill()

    ctx.shadowBlur = 0
    ctx.globalAlpha = 0.5
    ctx.strokeStyle = '#ffffff'
    for (const marker of [1 / 3, 2 / 3]) {
      const markerX = x + barWidth * marker
      ctx.beginPath()
      ctx.moveTo(markerX, y + 2)
      ctx.lineTo(markerX, y + barHeight - 2)
      ctx.stroke()
    }

    ctx.globalAlpha = 1
    ctx.fillStyle = '#f8f8ff'
    ctx.font = '10px Orbitron, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText(`BOSS ${Math.ceil(enemy.health)} / ${enemy.maxHealth}`, x + barWidth / 2, y - 4)
    ctx.restore()
  }

  function drawPlayerEffects(now: number): void {
    if (!ctx) return

    const centerX = playerX + 75
    const centerY = playerY + playerOffsetY + 75
    const shieldActive = gameManager.player.shieldActive
    const invincible = gameManager.player.invincible
    const weaponActive = gameManager.player.weaponType !== 'SINGLE'
    const speedActive = gameManager.player.speed > GAME_CONFIG.PLAYER.SPEED
    const pulse = 0.5 + Math.sin(now / 180) * 0.5

    if (speedActive) {
      ctx.save()
      ctx.globalAlpha = 0.28 + pulse * 0.18
      ctx.fillStyle = '#00d4ff'
      ctx.shadowColor = '#00d4ff'
      ctx.shadowBlur = 18
      ctx.beginPath()
      ctx.moveTo(centerX - 30, centerY + 58)
      ctx.lineTo(centerX, centerY + 122 + pulse * 18)
      ctx.lineTo(centerX + 30, centerY + 58)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    if (weaponActive) {
      ctx.save()
      ctx.globalAlpha = 0.2 + pulse * 0.12
      ctx.strokeStyle = '#ffaa22'
      ctx.shadowColor = '#ffaa22'
      ctx.shadowBlur = 16
      ctx.lineWidth = 3
      ctx.setLineDash([10, 12])
      ctx.lineDashOffset = -now / 45
      ctx.beginPath()
      ctx.arc(centerX, centerY, 84 + pulse * 4, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }

    if (shieldActive || invincible || playerInvincible) {
      const shieldColor = shieldActive ? '#39f5ff' : '#78b8ff'
      const radius = shieldActive ? 92 + pulse * 7 : 86 + pulse * 4

      ctx.save()
      ctx.globalAlpha = shieldActive ? 0.18 + pulse * 0.1 : 0.12 + pulse * 0.08
      const gradient = ctx.createRadialGradient(centerX, centerY, 34, centerX, centerY, radius)
      gradient.addColorStop(0, 'rgba(57, 245, 255, 0)')
      gradient.addColorStop(0.72, shieldActive ? 'rgba(57, 245, 255, 0.16)' : 'rgba(120, 184, 255, 0.12)')
      gradient.addColorStop(1, 'rgba(57, 245, 255, 0.02)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      ctx.save()
      ctx.globalAlpha = shieldActive ? 0.68 : 0.38
      ctx.strokeStyle = shieldColor
      ctx.shadowColor = shieldColor
      ctx.shadowBlur = shieldActive ? 24 : 14
      ctx.lineWidth = shieldActive ? 3 : 2
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }
  }

  function drawPlayer(now: number): void {
    const image = images.get('player')
    const glow = playerInvincible ? '#00ffff' : '#00aaff'
    drawPlayerEffects(now)
    drawImageWithGlow(
      image,
      playerX,
      playerY + playerOffsetY,
      150,
      150,
      glow,
      playerInvincible ? 24 : 12,
      (playerRotation * Math.PI) / 180,
      playerScale,
      playerOpacity
    )
  }

  function drawParticles(deltaMs: number): void {
    if (!ctx) return

    if (gameManager.isPlaying && !gameManager.isPaused) {
      particleSystem.update(deltaMs)
    }

    for (const particle of particleSystem.getActiveParticles()) {
      ctx.save()
      ctx.globalAlpha = Math.max(0, particle.life)
      ctx.fillStyle = particle.color
      ctx.shadowColor = particle.color
      ctx.shadowBlur = particle.size * 2
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  function render(now: number): void {
    if (!ctx) {
      animationFrameId = requestAnimationFrame(render)
      return
    }

    const deltaMs = lastFrame ? Math.min(32, now - lastFrame) : 16
    const delta = deltaMs / 1000
    lastFrame = now

    ctx.clearRect(0, 0, width, height)
    drawBackground(delta)

    for (const powerUp of powerUps) drawPowerUp(powerUp, now)
    for (const bullet of playerBullets) drawProjectile(bullet, '#ffaa22', '#ff9933', 'up')
    for (const bullet of enemyBullets) drawProjectile(bullet, '#ff3322', '#ff3333', 'down')
    for (const enemy of enemies) drawEnemy(enemy, now)
    drawPlayer(now)
    drawParticles(deltaMs)

    animationFrameId = requestAnimationFrame(render)
  }

  onMount(() => {
    loadImages()
    resizeCanvas()
    resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(game_pad)
    animationFrameId = requestAnimationFrame(render)
  })

  onDestroy(() => {
    resizeObserver?.disconnect()
    cancelAnimationFrame(animationFrameId)
    particleSystem.clear()
  })
</script>

<canvas bind:this={canvas} class="game-canvas-layer" aria-hidden="true"></canvas>

<style>
  .game-canvas-layer {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
  }
</style>
