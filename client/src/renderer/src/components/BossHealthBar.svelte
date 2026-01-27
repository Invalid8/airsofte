<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { fly } from 'svelte/transition'
  import { gameEvents } from '../lib/eventBus'
  import type { Enemy } from '../types/gameTypes'

  let showBossBar = $state(false)
  let bossEnemy = $state<Enemy | null>(null)
  let healthPercentage = $derived(bossEnemy ? (bossEnemy.health / bossEnemy.maxHealth) * 100 : 0)
  let currentPhase = $derived(
    !bossEnemy ? 0 : healthPercentage > 66 ? 1 : healthPercentage > 33 ? 2 : 3
  )

  let barX = $derived(bossEnemy ? bossEnemy.x + bossEnemy.width / 2 - 250 : 0)
  let barY = $derived(bossEnemy ? bossEnemy.y - 80 : 0)

  function handleBossSpawn(event): void {
    const { enemy } = event.data
    if (enemy && enemy.type === 'BOSS') {
      bossEnemy = enemy
      showBossBar = true
    }
  }

  function handleBossUpdate(event): void {
    const { enemy } = event.data
    if (enemy && enemy.type === 'BOSS' && bossEnemy?.id === enemy.id) {
      bossEnemy = { ...enemy }
    }
  }

  function handleBossDefeated(): void {
    setTimeout(() => {
      showBossBar = false
      bossEnemy = null
    }, 2000)
  }

  let unsubSpawn: (() => void) | null = null
  let unsubUpdate: (() => void) | null = null
  let unsubDefeated: (() => void) | null = null

  onMount(() => {
    unsubSpawn = gameEvents.on('ENEMY_SPAWNED', handleBossSpawn)
    unsubUpdate = gameEvents.on('BOSS_UPDATE', handleBossUpdate)
    unsubDefeated = gameEvents.on('BOSS_DEFEATED', handleBossDefeated)

    return () => {
      if (unsubSpawn) unsubSpawn()
      if (unsubUpdate) unsubUpdate()
      if (unsubDefeated) unsubDefeated()
    }
  })

  onDestroy(() => {
    showBossBar = false
    bossEnemy = null
  })
</script>

{#if showBossBar && bossEnemy}
  <div
    class="boss-health-container absolute z-[55]"
    style="left: {barX}px; top: {barY}px;"
    in:fly={{ y: -50, duration: 500 }}
  >
    <div class="boss-info mb-2 flex justify-between items-center">
      <div class="boss-name text-xl font-bold text-red-500 title animate-pulse">
        ⚔️ THE GUARDIAN
      </div>
      <div class="boss-phase text-xs opacity-70">
        PHASE {currentPhase} / 3
      </div>
    </div>

    <div
      class="health-bar-container h-6 bg-black/80 border-2 border-red-500 rounded-lg overflow-hidden relative"
      style="width: 500px;"
    >
      <div
        class="health-bar h-full transition-all duration-300"
        class:phase-1={healthPercentage > 66}
        class:phase-2={healthPercentage > 33 && healthPercentage <= 66}
        class:phase-3={healthPercentage <= 33}
        style="width: {healthPercentage}%"
      ></div>

      <div
        class="health-text absolute inset-0 flex items-center justify-center font-bold hud text-sm z-10"
      >
        {Math.ceil(bossEnemy.health)} / {bossEnemy.maxHealth}
      </div>

      <div class="phase-markers absolute inset-0 flex">
        <div class="phase-marker" style="left: 33.33%"></div>
        <div class="phase-marker" style="left: 66.66%"></div>
      </div>
    </div>
  </div>
{/if}

<style>
  .boss-health-container {
    animation: boss-entrance 0.5s ease-out;
    pointer-events: none;
  }

  @keyframes boss-entrance {
    from {
      transform: scale(0.8);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  .health-bar-container {
    box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
    animation: pulse-border 2s ease-in-out infinite;
  }

  @keyframes pulse-border {
    0%,
    100% {
      border-color: rgba(255, 0, 0, 1);
      box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
    }
    50% {
      border-color: rgba(255, 0, 0, 0.7);
      box-shadow: 0 0 30px rgba(255, 0, 0, 0.8);
    }
  }

  .health-bar {
    box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.3);
    background: linear-gradient(90deg, #ff0000, #ff6600);
  }

  .health-bar.phase-1 {
    background: linear-gradient(90deg, #ff0000, #ff3300);
  }

  .health-bar.phase-2 {
    background: linear-gradient(90deg, #ff6600, #ffaa00);
    animation: phase-2-pulse 0.5s ease-in-out infinite;
  }

  .health-bar.phase-3 {
    background: linear-gradient(90deg, #ff0000, #aa0000);
    animation: phase-3-pulse 0.3s ease-in-out infinite;
  }

  @keyframes phase-2-pulse {
    0%,
    100% {
      filter: brightness(1);
    }
    50% {
      filter: brightness(1.2);
    }
  }

  @keyframes phase-3-pulse {
    0%,
    100% {
      filter: brightness(1);
    }
    50% {
      filter: brightness(1.5);
    }
  }

  .phase-marker {
    position: absolute;
    width: 2px;
    height: 100%;
    background: rgba(255, 255, 255, 0.5);
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
  }

  .health-text {
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  }

  .boss-name {
    text-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
  }
</style>
