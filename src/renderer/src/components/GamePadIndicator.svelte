<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { fade } from 'svelte/transition'
  import { gamepadManager } from '../utils/gamepadManager'

  let isConnected = $state(false)
  let gamepadName = $state<string | null>(null)
  let checkInterval: number

  onMount(() => {
    checkInterval = window.setInterval(() => {
      isConnected = gamepadManager.isConnected()
      gamepadName = gamepadManager.getGamepadInfo()
    }, 1000)

    return () => {
      clearInterval(checkInterval)
    }
  })

  onDestroy(() => {
    clearInterval(checkInterval)
  })
</script>

{#if isConnected}
  <div
    class="gamepad-indicator fixed bottom-20 left-6 z-50 bg-black/80 border-2 border-green-500 rounded-lg px-4 py-2 flex items-center gap-3"
    in:fade={{ duration: 300 }}
    out:fade={{ duration: 300 }}
  >
    <div class="gamepad-icon text-2xl animate-pulse">🎮</div>
    <div class="gamepad-info">
      <div class="text-xs opacity-70">Gamepad Connected</div>
      <div class="text-sm font-bold text-green-400">{gamepadName || 'Unknown Controller'}</div>
    </div>
  </div>
{/if}

<style>
  .gamepad-indicator {
    box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
</style>
