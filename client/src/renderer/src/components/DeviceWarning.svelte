<script lang="ts">
  import { onMount } from 'svelte'
  import { getDeviceType, isLandscape } from '../lib/utils'

  let deviceType = $state<'mobile' | 'tablet' | 'desktop'>('desktop')
  let showWarning = $state(false)
  let isLandscapeMode = $state(false)

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
        <p class="warning-message">Please rotate your tablet to landscape mode to continue.</p>
        <div class="rotation-icon">🔄</div>
        <div class="suggestion">
          <p>Landscape orientation provides the best gaming experience.</p>
        </div>
      {/if}
    </div>
  </div>
{:else}
  <slot />
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

  .suggestion {
    padding: 1rem;
    background: rgba(0, 170, 255, 0.1);
    border-left: 3px solid #00aaff;
    border-radius: 0.25rem;
    font-size: 0.9375rem;
    opacity: 0.9;
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

  @media (max-width: 768px) {
    .warning-title {
      font-size: 1.5rem;
    }

    .warning-message {
      font-size: 1rem;
    }

    .device-info {
      padding: 1rem;
    }
  }
</style>
