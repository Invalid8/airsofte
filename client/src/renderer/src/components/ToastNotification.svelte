<script lang="ts">
  import { fly } from 'svelte/transition'

  let {
    message,
    visible = false,
    duration = 3000,
    onClose = () => {},
    type = 'info'
  }: {
    message?: string
    visible?: boolean
    duration?: number
    onClose?: () => void
    type?: 'success' | 'info' | 'warning' | 'error'
  } = $props()

  $effect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        visible = false
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }

    return null
  })
</script>

{#if visible}
  <div class="toast {type}" transition:fly={{ y: -50, duration: 300 }}>
    <div class="toast-content">
      {#if type === 'success'}
        <span class="icon">✓</span>
      {:else if type === 'error'}
        <span class="icon">✗</span>
      {:else if type === 'warning'}
        <span class="icon">⚠</span>
      {:else}
        <span class="icon">ℹ</span>
      {/if}
      <span class="message">{message}</span>
    </div>
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    top: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    color: white;
    font-weight: bold;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    min-width: 200px;
    max-width: 400px;
  }

  .toast.info {
    background: rgba(0, 170, 255, 0.95);
    border: 2px solid #00aaff;
  }

  .toast.success {
    background: rgba(0, 255, 136, 0.95);
    border: 2px solid #00ff88;
  }

  .toast.warning {
    background: rgba(255, 170, 0, 0.95);
    border: 2px solid #ffaa00;
  }

  .toast.error {
    background: rgba(255, 68, 68, 0.95);
    border: 2px solid #ff4444;
  }

  .toast-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .message {
    flex: 1;
    font-size: 0.9375rem;
  }

  @media (max-width: 768px) {
    .toast {
      top: 1rem;
      right: 1rem;
      left: 1rem;
      max-width: none;
    }
  }
</style>
