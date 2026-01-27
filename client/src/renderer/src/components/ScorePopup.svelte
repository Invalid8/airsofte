<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { fade, fly } from 'svelte/transition'
  import { gameEvents } from '../lib/eventBus'

  type ScorePopup = {
    id: string
    x: number
    y: number
    score: number
    color: string
  }

  let popups = $state<ScorePopup[]>([])
  let popupCounter = 0

  function handleEnemyDestroyed(event): void {
    const { enemy } = event.data
    if (!enemy) return

    const color =
      {
        BASIC: '#ffaa00',
        SCOUT: '#00ff88',
        BOMBER: '#ff6600',
        BOSS: '#ff00ff'
      }[enemy.type] || '#ffaa00'

    const popup: ScorePopup = {
      id: `popup_${popupCounter++}`,
      x: enemy.x + enemy.width / 2,
      y: enemy.y + enemy.height / 2,
      score: enemy.scoreValue,
      color
    }

    popups = [...popups, popup]

    setTimeout(() => {
      popups = popups.filter((p) => p.id !== popup.id)
    }, 1500)
  }

  let unsubscribe: (() => void) | null = null

  onMount(() => {
    unsubscribe = gameEvents.on('ENEMY_DESTROYED', handleEnemyDestroyed)
  })

  onDestroy(() => {
    if (unsubscribe) unsubscribe()
  })
</script>

{#each popups as popup (popup.id)}
  <div
    class="score-popup absolute pointer-events-none"
    style="left: {popup.x}px; top: {popup.y}px; color: {popup.color};"
    in:fly={{ y: -50, duration: 300 }}
    out:fade={{ duration: 200 }}
  >
    <div class="score-text hud">+{popup.score}</div>
  </div>
{/each}

<style>
  .score-popup {
    z-index: 100;
    animation: float-up 1.5s ease-out forwards;
  }

  .score-text {
    font-size: 1.5rem;
    font-weight: bold;
    text-shadow:
      0 0 10px currentColor,
      2px 2px 4px rgba(0, 0, 0, 0.8);
    animation: pulse-scale 0.3s ease-out;
  }

  @keyframes float-up {
    0% {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
    100% {
      transform: translateY(-60px) scale(1.2);
      opacity: 0;
    }
  }

  @keyframes pulse-scale {
    0% {
      transform: scale(0.5);
    }
    50% {
      transform: scale(1.3);
    }
    100% {
      transform: scale(1);
    }
  }
</style>
