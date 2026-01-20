<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { fly } from 'svelte/transition'
  import { gameEvents } from '../lib/eventBus'

  let showTransition = $state(false)
  let waveNumber = $state(1)
  let transitionType: 'start' | 'complete' = $state('start')

  function handleWaveStart(event): void {
    waveNumber = event.data.wave
    transitionType = 'start'
    showTransition = true

    setTimeout(() => {
      showTransition = false
    }, 3000)
  }

  function handleWaveComplete(event): void {
    waveNumber = event.data.wave
    transitionType = 'complete'
    showTransition = true

    setTimeout(() => {
      showTransition = false
    }, 2500)
  }

  let unsubStart: (() => void) | null = null
  let unsubComplete: (() => void) | null = null

  onMount(() => {
    unsubStart = gameEvents.on('WAVE_START', handleWaveStart)
    unsubComplete = gameEvents.on('WAVE_COMPLETE', handleWaveComplete)
  })

  onDestroy(() => {
    if (unsubStart) unsubStart()
    if (unsubComplete) unsubComplete()
  })
</script>

{#if showTransition}
  <div
    class="wave-notification fixed right-8 bottom-24 z-[60] pointer-events-none"
    in:fly={{ x: 300, duration: 400 }}
    out:fly={{ x: 300, duration: 300 }}
  >
    <div
      class="notification-card bg-black/90 border-2 rounded-lg p-6 shadow-2xl backdrop-blur-sm min-w-[280px]"
      class:border-cyan-500={transitionType === 'start'}
      class:border-green-500={transitionType === 'complete'}
    >
      {#if transitionType === 'start'}
        <div class="flex flex-col gap-2">
          <div class="text-sm opacity-70 uppercase tracking-wider">Incoming</div>
          <div class="text-4xl font-bold glow-text title">Wave {waveNumber}</div>
          <div class="text-sm opacity-80 mt-1">Prepare for battle!</div>
        </div>
      {:else}
        <div class="flex flex-col gap-2">
          <div class="text-sm opacity-70 uppercase tracking-wider text-green-400">Complete</div>
          <div
            class="text-3xl font-bold title"
            style="color: #00ff88; text-shadow: 0 0 20px rgba(0, 255, 136, 0.8);"
          >
            Wave {waveNumber}
          </div>
          <div class="text-sm opacity-80 mt-1">Well done!</div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .notification-card {
    animation: pulse-border 2s ease-in-out infinite;
  }

  @keyframes pulse-border {
    0%,
    100% {
      box-shadow: 0 0 20px rgba(0, 170, 255, 0.5);
    }
    50% {
      box-shadow: 0 0 30px rgba(0, 170, 255, 0.8);
    }
  }

  .border-green-500 {
    animation: pulse-border-green 2s ease-in-out infinite;
  }

  @keyframes pulse-border-green {
    0%,
    100% {
      box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
    }
    50% {
      box-shadow: 0 0 30px rgba(0, 255, 136, 0.8);
    }
  }

  .title {
    word-spacing: -10px;
    line-height: 110%;
    font-family: 'Press Start 2P', cursive;
  }
</style>
