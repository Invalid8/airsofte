<script lang="ts">
  import { onMount } from 'svelte'
  import { fly, fade } from 'svelte/transition'
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
    }, 2000)
  }

  function handleWaveComplete(event): void {
    waveNumber = event.data.wave
    transitionType = 'complete'
    showTransition = true

    setTimeout(() => {
      showTransition = false
    }, 2500)
  }

  onMount(() => {
    const unsubStart = gameEvents.on('WAVE_START', handleWaveStart)
    const unsubComplete = gameEvents.on('WAVE_COMPLETE', handleWaveComplete)

    return () => {
      unsubStart()
      unsubComplete()
    }
  })
</script>

{#if showTransition}
  <div
    class="wave-transition fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
    in:fade={{ duration: 300 }}
    out:fade={{ duration: 300 }}
  >
    <div class="overlay absolute inset-0 bg-black/60"></div>

    <div class="content relative z-10" in:fly={{ y: -50, duration: 500 }}>
      {#if transitionType === 'start'}
        <div class="text-center">
          <div class="title text-6xl uppercase glow-text mb-4">Wave {waveNumber}</div>
          <div class="subtitle text-2xl opacity-80">Prepare for Battle!</div>
        </div>
      {:else}
        <div class="text-center">
          <div
            class="title text-5xl uppercase text-green-400 mb-4"
            style="text-shadow: 0 0 20px rgba(0, 255, 0, 0.8);"
          >
            Wave {waveNumber} Complete!
          </div>
          <div class="subtitle text-2xl opacity-80">Get Ready...</div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .wave-transition {
    animation: pulse 2s ease-in-out;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.9;
    }
  }

  .title {
    word-spacing: -20px;
    line-height: 110%;
    font-family: 'Press Start 2P', cursive;
  }

  .subtitle {
    font-family: 'Orbitron', sans-serif;
  }
</style>
