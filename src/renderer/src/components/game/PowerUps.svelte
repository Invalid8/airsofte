<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type { PowerUp } from '../../types/gameTypes'
  import { powerUpSystem } from '../../lib/powerUpSystem'
  import { gameManager } from '../../utils/gameManager'
  import { gameEvents } from '../../lib/eventBus'
  import { particleSystem } from '../../lib/particleSystem'
  import { getBoundingBox } from '../../utils/collisionSystem'
  import PowerUpHealth from '../../assets/sprites/powerup-health.png'
  import PowerUpWeapon from '../../assets/sprites/powerup-weapon.png'
  import PowerUpShield from '../../assets/sprites/powerup-shield.png'
  import PowerUpSpeed from '../../assets/sprites/powerup-speed.png'

  let {
    game_pad,
    playerX = 0,
    playerY = 0
  }: {
    game_pad: HTMLDivElement
    playerX?: number
    playerY?: number
  } = $props()

  let powerUps = $state<PowerUp[]>([])
  let animationFrameId: number

  const powerUpSprites = {
    HEALTH: PowerUpHealth,
    WEAPON: PowerUpWeapon,
    SHIELD: PowerUpShield,
    SPEED: PowerUpSpeed,
    SCORE: PowerUpSpeed
  }

  function getPowerUpSprite(type: PowerUp['type']): string {
    return powerUpSprites[type]
  }

  function updatePowerUps(): void {
    if (!gameManager.isPlaying || gameManager.isPaused) {
      animationFrameId = requestAnimationFrame(updatePowerUps)
      return
    }

    const bounds = getBoundingBox(0, 0, game_pad.clientWidth, game_pad.clientHeight)
    powerUpSystem.updatePowerUps(bounds)

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

  function handleEnemyDestroyed(event): void {
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

{#each powerUps as powerUp (powerUp.id)}
  <img
    class="powerup absolute pointer-events-none animate-pulse"
    src={getPowerUpSprite(powerUp.type)}
    alt="Power-Up {powerUp.type}"
    style="left: {powerUp.x}px; top: {powerUp.y}px; width: {powerUp.width}px; height: {powerUp.height}px;"
  />
{/each}

<style>
  .powerup {
    filter: drop-shadow(0 0 12px rgba(0, 255, 136, 0.8));
    animation:
      float 2s ease-in-out infinite,
      rotate 3s linear infinite;
  }

  @keyframes float {
    0%,
    100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
