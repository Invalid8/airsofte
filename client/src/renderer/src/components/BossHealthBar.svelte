<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { gameEvents } from '../lib/eventBus'
  import type { Enemy } from '../types/gameTypes'

  let bossEnemy = $state<Enemy | null>(null)
  let healthPercentage = $derived(bossEnemy ? (bossEnemy.health / bossEnemy.maxHealth) * 100 : 0)

  function handleBossSpawn(event): void {
    const { enemy } = event.data
    if (enemy && enemy.type === 'BOSS') {
      bossEnemy = enemy
    }
  }

  function handleBossUpdate(event): void {
    const { enemy } = event.data
    if (enemy && enemy.type === 'BOSS') {
      bossEnemy = { ...enemy }
    }
  }

  function handleBossDefeated(): void {
    setTimeout(() => {
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
    bossEnemy = null
  })
</script>

{#if bossEnemy}
  <div
    class="boss-health-bar"
    style="
      left: {bossEnemy.x}px;
      top: {bossEnemy.y - 40}px;
      width: {bossEnemy.width}px;
    "
  >
    <div class="bar-bg">
      <div class="bar-fill" style="width: {healthPercentage}%"></div>
      <div class="bar-text hud">
        {Math.ceil(bossEnemy.health)} / {bossEnemy.maxHealth}
      </div>
    </div>
  </div>
{/if}

<style>
  .boss-health-bar {
    position: absolute;
    z-index: 50;
    pointer-events: none;
  }

  .bar-bg {
    position: relative;
    height: 20px;
    background: rgba(0, 0, 0, 0.8);
    border: 2px solid #ff0000;
    border-radius: 4px;
    overflow: hidden;
  }

  .bar-fill {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, #ff0000, #ff6600);
    transition: width 0.2s ease;
  }

  .bar-text {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    color: white;
    text-shadow: 1px 1px 2px black;
    z-index: 1;
  }
</style>
