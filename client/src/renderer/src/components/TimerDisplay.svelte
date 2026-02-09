<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { objectiveTracker } from '../lib/objectiveTracker'

  let timeRemaining = $state(0)
  let isActive = $state(false)
  let updateInterval: number | null = null

  onMount(() => {
    updateInterval = window.setInterval(() => {
      isActive = objectiveTracker.isSurviveTimerActive()

      if (isActive) {
        timeRemaining = objectiveTracker.getSurviveTimeRemaining()
      }
    }, 100)

    return () => {
      if (updateInterval) {
        clearInterval(updateInterval)
      }
    }
  })

  onDestroy(() => {
    if (updateInterval) {
      clearInterval(updateInterval)
    }
  })

  function formatTime(ms: number): string {
    const totalSeconds = Math.ceil(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  const isLowTime = $derived(timeRemaining < 30000 && timeRemaining > 0)
  const isCriticalTime = $derived(timeRemaining < 10000 && timeRemaining > 0)
</script>

{#if isActive}
  <div class="timer-container fixed top-4 left-1/2 -translate-x-1/2 z-40">
    <div class="timer-display" class:low-time={isLowTime} class:critical-time={isCriticalTime}>
      <div class="timer-label">TIME REMAINING</div>
      <div class="timer-value hud">
        {formatTime(timeRemaining)}
      </div>
    </div>
  </div>
{/if}

<style>
  .timer-display {
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid rgba(0, 170, 255, 0.6);
    border-radius: 0.5rem;
    padding: 1rem 2rem;
    text-align: center;
    backdrop-filter: blur(8px);
    box-shadow: 0 0 20px rgba(0, 170, 255, 0.3);
  }

  .timer-label {
    font-family: 'Orbitron', sans-serif;
    font-size: 0.75rem;
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #00aaff;
    margin-bottom: 0.25rem;
  }

  .timer-value {
    font-size: 2rem;
    font-weight: bold;
    color: #00aaff;
  }

  .timer-display.low-time {
    border-color: rgba(255, 165, 0, 0.8);
    animation: pulse-orange 1s ease-in-out infinite;
  }

  .timer-display.low-time .timer-value {
    color: #ffa500;
  }

  .timer-display.critical-time {
    border-color: rgba(255, 0, 0, 1);
    animation: pulse-red 0.5s ease-in-out infinite;
  }

  .timer-display.critical-time .timer-value {
    color: #ff0000;
  }

  @keyframes pulse-orange {
    0%,
    100% {
      box-shadow: 0 0 20px rgba(255, 165, 0, 0.4);
    }
    50% {
      box-shadow: 0 0 30px rgba(255, 165, 0, 0.7);
    }
  }

  @keyframes pulse-red {
    0%,
    100% {
      box-shadow: 0 0 25px rgba(255, 0, 0, 0.6);
      transform: scale(1);
    }
    50% {
      box-shadow: 0 0 40px rgba(255, 0, 0, 0.9);
      transform: scale(1.05);
    }
  }
</style>
