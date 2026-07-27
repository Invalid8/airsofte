<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type { Bullet } from '$lib/types/gameTypes'

  let {
    game_pad,
    playerBullets = [],
    enemyBullets = []
  }: {
    game_pad: HTMLDivElement
    playerBullets?: Bullet[]
    enemyBullets?: Bullet[]
  } = $props()

  let canvas: HTMLCanvasElement | undefined
  let ctx: CanvasRenderingContext2D | null = null
  let resizeObserver: ResizeObserver | null = null
  let width = 0
  let height = 0

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

    ctx = canvas.getContext('2d')
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawProjectiles()
  }

  function drawBullet(
    bullet: Bullet,
    color: string,
    glow: string,
    capDirection: 'up' | 'down'
  ): void {
    if (!ctx || !bullet.active) return

    const radius = Math.min(bullet.width / 2, 5)
    const x = bullet.x
    const y = bullet.y
    const w = bullet.width
    const h = bullet.height
    const topRadius = capDirection === 'up' ? radius : 2
    const bottomRadius = capDirection === 'down' ? radius : 2

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
  }

  function drawProjectiles(): void {
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)

    for (const bullet of playerBullets) {
      drawBullet(bullet, '#ffaa22', '#ff9933', 'up')
    }

    for (const bullet of enemyBullets) {
      drawBullet(bullet, '#ff3322', '#ff3333', 'down')
    }

    ctx.shadowBlur = 0
  }

  $effect(() => {
    playerBullets
    enemyBullets
    drawProjectiles()
  })

  onMount(() => {
    resizeCanvas()
    resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(game_pad)
  })

  onDestroy(() => {
    resizeObserver?.disconnect()
  })
</script>

<canvas bind:this={canvas} class="projectile-layer" aria-hidden="true"></canvas>

<style>
  .projectile-layer {
    position: absolute;
    inset: 0;
    z-index: 12;
    pointer-events: none;
  }
</style>
