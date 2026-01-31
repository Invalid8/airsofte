<script lang="ts">
  import { onMount } from 'svelte'
  import { getDeviceType, isLandscape } from '../lib/utils'

  let deviceType = $state<'mobile' | 'tablet' | 'desktop'>('desktop')
  let showWarning = $state(false)
  let isLandscapeMode = $state(false)

  let { children } = $props();

  onMount(() => {
    checkDevice()

    window.addEventListener('resize', checkDevice)
    window.addEventListener('orientationchange', checkDevice)

    return () => {
      window.removeEventListener('resize', checkDevice)
      window.removeEventListener('orientationchange', checkDevice)
    }
  })

  function checkDevice() {
    deviceType = getDeviceType()
    isLandscapeMode = isLandscape()

    // Show warning for mobile devices
    // Allow tablets with landscape orientation
    if (deviceType === 'mobile') {
      showWarning = true
    } else if (deviceType === 'tablet' && !isLandscapeMode) {
      showWarning = true
    } else {
      showWarning = false
    }
  }
</script>

{#if showWarning}
  <div class="device-warning-overlay">
    <div class="device-warning-content">
      <div class="warning-icon">⚠️</div>

      {#if deviceType === 'mobile'}
        <h1 class="warning-title title">Desktop Required</h1>
        <p class="warning-message">
          For the best experience, please open this game on a desktop or laptop computer.
        </p>
        <div class="device-info">
          <div class="info-item">
            <strong>Minimum Screen:</strong> 900x670 pixels
          </div>
          <div class="info-item">
            <strong>Controls:</strong> Keyboard required
          </div>
        </div>
      {:else if deviceType === 'tablet'}
        <h1 class="warning-title title">Rotate Your Device</h1>
        <p class="warning-message">Please rotate your tablet to landscape mode to play.</p>
        <div class="rotation-icon">🔄</div>
      {/if}

      <div class="continue-anyway">
        <button class="continue-btn" onclick={() => (showWarning = false)}>
          Continue Anyway
        </button>
        <p class="disclaimer">Note: Controls may not work properly on touch devices</p>
      </div>
    </div>
  </div>
{:else}
  {@render children()}
{/if}

<style>
  .device-warning-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .device-warning-content {
    max-width: 500px;
    text-align: center;
    animation: fadeInUp 0.6s ease-out;
  }

  .warning-icon {
    font-size: 4rem;
    margin-bottom: 1.5rem;
    animation: pulse 2s ease-in-out infinite;
  }

  .warning-title {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: #00aaff;
    text-shadow: 0 0 20px rgba(0, 170, 255, 0.6);
    word-spacing: -10px;
  }

  .warning-message {
    font-size: 1.125rem;
    line-height: 1.6;
    margin-bottom: 2rem;
    opacity: 0.9;
  }

  .device-info {
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(0, 170, 255, 0.3);
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .info-item {
    padding: 0.5rem 0;
    font-size: 0.875rem;
  }

  .info-item strong {
    color: #00aaff;
  }

  .rotation-icon {
    font-size: 3rem;
    margin: 2rem 0;
    animation: rotate 2s linear infinite;
  }

  .continue-anyway {
    margin-top: 2rem;
  }

  .continue-btn {
    background: linear-gradient(135deg, rgba(2, 90, 179, 0.95), rgba(3, 129, 175, 0.95));
    border: 2px solid #00aaff;
    border-radius: 8px;
    color: white;
    padding: 0.875rem 2rem;
    font-size: 1rem;
    font-family: 'Press Start 2P', monospace;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 0 20px rgba(0, 170, 255, 0.4);
  }

  .continue-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 30px rgba(0, 170, 255, 0.6);
  }

  .disclaimer {
    margin-top: 1rem;
    font-size: 0.75rem;
    opacity: 0.6;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
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
