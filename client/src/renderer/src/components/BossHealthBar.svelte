<script lang="ts">
  import { onMount } from 'svelte'
  import type { Enemy } from '../types/gameTypes'
  import { gameEvents } from '../lib/eventBus'

  let bossEnemy = $state<Enemy | null>(null)
  let unsubSpawn: (() => void) | null = null
  let unsubUpdate: (() => void) | null = null
  let unsubDefeated: (() => void) | null = null

  let healthPercentage = $derived(bossEnemy ? (bossEnemy.health / bossEnemy.maxHealth) * 100 : 0)

  function handleBossSpawn(event: any): void {
    if (event.enemy?.type === 'BOSS') {
      bossEnemy = event.enemy
    }
  }

  function handleBossUpdate(event: any): void {
    if (event.enemy?.type === 'BOSS') {
      bossEnemy = event.enemy
    }
  }

  function handleBossDefeated(): void {
    bossEnemy = null
  }

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
</script>

{#if bossEnemy}
  <div class="boss-health-bar">
    <div class="boss-name">{'Boss Enemy'}</div>
    <div class="health-bar-container">
      <div class="health-bar-fill" style="width: {healthPercentage}%"></div>
    </div>
    <div class="health-text">
      {Math.ceil(bossEnemy.health)} / {bossEnemy.maxHealth}
    </div>
  </div>
{/if}

<style>
  .boss-health-bar {
    position: fixed;
    top: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid rgba(255, 0, 0, 0.8);
    border-radius: 8px;
    padding: 1rem 2rem;
    min-width: 400px;
    z-index: 100;
  }

  .boss-name {
    text-align: center;
    font-size: 1.5rem;
    font-weight: bold;
    color: #ff3333;
    margin-bottom: 0.5rem;
    text-shadow: 0 0 10px rgba(255, 50, 50, 0.8);
  }

  .health-bar-container {
    width: 100%;
    height: 24px;
    background: rgba(100, 0, 0, 0.5);
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid rgba(255, 0, 0, 0.5);
  }

  .health-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff0000, #ff6666);
    transition: width 0.3s ease;
    box-shadow: 0 0 10px rgba(255, 0, 0, 0.6);
  }

  .health-text {
    text-align: center;
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: #fff;
    opacity: 0.8;
  }
</style>
