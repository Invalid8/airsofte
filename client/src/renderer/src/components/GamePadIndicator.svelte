<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { fly } from 'svelte/transition'
  import { gamepadManager } from '../utils/gamepadManager'

  let isConnected = $state(false)
  let showIndicator = $state(false)
  let hideTimeout: number | null = null
  let gamepadName = $state<string | null>(null)
  let checkInterval: number

  function showWithTimeout() {
    showIndicator = true

    if (hideTimeout) clearTimeout(hideTimeout)

    hideTimeout = window.setTimeout(() => {
      showIndicator = false
    }, 60000)
  }

  onMount(() => {
    checkInterval = window.setInterval(() => {
      const connected = gamepadManager.isConnected()
      gamepadName = gamepadManager.getGamepadInfo()

      if (connected && !isConnected) {
        // New Connection
        isConnected = true
        showWithTimeout()
      } else if (!connected && isConnected) {
        // Disconnected
        isConnected = false
        showIndicator = false
      }
    }, 1000)

    return () => {
      clearInterval(checkInterval)
      if (hideTimeout) clearTimeout(hideTimeout)
    }
  })

  onDestroy(() => {
    clearInterval(checkInterval)
  })
</script>

{#if showIndicator}
  <div
    class="gamepad-indicator fixed bottom-20 left-6 z-50 bg-black/80 border-2 border-green-500 rounded-lg px-4 py-3 flex items-center gap-3 lg:max-w-md max-w-screen"
    in:fly={{ y: -20, duration: 300 }}
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
