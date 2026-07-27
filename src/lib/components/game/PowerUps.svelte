<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type { GameEvent, PowerUp } from '$lib/types/gameTypes'
  import { powerUpSystem } from '$lib/game/powerUpSystem'
  import { gameManager } from '$lib/game/gameManager'
  import { gameEvents } from '$lib/game/eventBus'
  import { particleSystem } from '$lib/game/particleSystem'
  import { getBoundingBox } from '$lib/utils/collisionSystem'

  let {
    game_pad,
    powerUps = $bindable([]),
    playerX = 0,
    playerY = 0
  }: {
    game_pad: HTMLDivElement
    powerUps?: PowerUp[]
    playerX?: number
    playerY?: number
  } = $props()

  let animationFrameId: number
  let lastFrameTime = 0

  function updatePowerUps(now: number): void {
    const deltaMs = lastFrameTime ? Math.min(50, now - lastFrameTime) : 1000 / 60
    lastFrameTime = now

    if (!gameManager.isPlaying || gameManager.isPaused) {
      animationFrameId = requestAnimationFrame(updatePowerUps)
      return
    }

    const bounds = getBoundingBox(0, 0, game_pad.clientWidth, game_pad.clientHeight)
    powerUpSystem.updatePowerUps(bounds, deltaMs)

    const playerBox = getBoundingBox(playerX, playerY, 150, 150)
    const collected = powerUpSystem.checkPlayerCollision(playerBox)

    if (collected) {
      particleSystem.createExplosion(
        collected.x + collected.width / 2,
        collected.y + collected.height / 2,
        15,
        '#00ff88'
      )
    }

    powerUps = powerUpSystem.getActivePowerUps()

    animationFrameId = requestAnimationFrame(updatePowerUps)
  }

  function handleEnemyDestroyed(event: GameEvent): void {
    const { enemy } = event.data

    if (enemy) {
      powerUpSystem.spawnRandomPowerUp(
        enemy.x + enemy.width / 2 - 20,
        enemy.y + enemy.height / 2 - 20
      )
    }
  }

  onMount(() => {
    const unsubEnemyDestroyed = gameEvents.on('ENEMY_DESTROYED', handleEnemyDestroyed)

    animationFrameId = requestAnimationFrame(updatePowerUps)

    return () => {
      cancelAnimationFrame(animationFrameId)
      unsubEnemyDestroyed()
    }
  })

  onDestroy(() => {
    cancelAnimationFrame(animationFrameId)
    powerUpSystem.clearAll()
  })
</script>
