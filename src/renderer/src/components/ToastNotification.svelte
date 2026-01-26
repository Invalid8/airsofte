<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { fly, fade } from 'svelte/transition'
  import { gameEvents } from '../lib/eventBus'

  type Toast = {
    id: string
    message: string
    type: 'success' | 'info' | 'warning' | 'error'
    duration: number
  }

  let toasts = $state<Toast[]>([])
  let toastCounter = 0

  function addToast(message: string, type: Toast['type'] = 'info', duration: number = 3000): void {
    const toast: Toast = {
      id: `toast_${toastCounter++}`,
      message,
      type,
      duration
    }

    toasts = [...toasts, toast]

    setTimeout(() => {
      removeToast(toast.id)
    }, duration)
  }

  function removeToast(id: string): void {
    toasts = toasts.filter((t) => t.id !== id)
  }

  onMount(() => {
    const unsubObjectiveComplete = gameEvents.on('OBJECTIVE_COMPLETED', (event) => {
      addToast(`✓ ${event.data.objective.description}`, 'success', 4000)
    })

    const unsubObjectiveFailed = gameEvents.on('OBJECTIVE_FAILED', (event) => {
      addToast(`✗ ${event.data.objective.description} - Failed`, 'error', 4000)
    })

    const unsubBonusComplete = gameEvents.on('BONUS_OBJECTIVE_COMPLETED', (event) => {
      addToast(
        `⭐ Bonus: ${event.data.objective.description} +${event.data.reward}`,
        'success',
        5000
      )
    })

    const unsubMessage = gameEvents.on('SHOW_MESSAGE', (event) => {
      const typeMap = {
        '#00ff88': 'success',
        '#00aaff': 'info',
        '#ffaa00': 'warning',
        '#ff6600': 'warning',
        '#ff0000': 'error'
      }
      const type = typeMap[event.data.color] || 'info'
      addToast(event.data.text, type, event.data.duration || 3000)
    })

    const unsubWaveComplete = gameEvents.on('WAVE_COMPLETE', (event) => {
      addToast(`Wave ${event.data.wave} Complete!`, 'success', 3000)
    })

    const unsubWaveStart = gameEvents.on('WAVE_START', (event) => {
      addToast(`Wave ${event.data.wave} - Incoming!`, 'info', 2500)
    })

    return () => {
      unsubObjectiveComplete()
      unsubObjectiveFailed()
      unsubBonusComplete()
      unsubMessage()
      unsubWaveComplete()
      unsubWaveStart()
    }
  })

  onDestroy(() => {
    toasts = []
  })
</script>

<div class="toast-container">
  {#each toasts as toast (toast.id)}
    <div
      class="toast toast-{toast.type}"
      in:fly={{ x: 300, duration: 300 }}
      out:fade={{ duration: 200 }}
    >
      <div class="toast-content">
        {toast.message}
      </div>
      <button class="toast-close" onclick={() => removeToast(toast.id)}>×</button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    bottom: 3rem;
    right: 2rem;
    z-index: 150;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    pointer-events: none;
    max-width: 24rem;
  }

  .toast {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: rgba(0, 0, 0, 0.92);
    border-radius: 0.75rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    pointer-events: auto;
    border: 2px solid;
    font-family: 'Press Start 2P', cursive;
    font-size: 0.75rem;
    line-height: 1.4;
  }

  .toast-success {
    border-color: rgba(0, 255, 136, 0.8);
    background: linear-gradient(135deg, rgba(0, 255, 136, 0.15) 0%, rgba(0, 0, 0, 0.92) 100%);
    color: #00ff88;
  }

  .toast-info {
    border-color: rgba(0, 170, 255, 0.8);
    background: linear-gradient(135deg, rgba(0, 170, 255, 0.15) 0%, rgba(0, 0, 0, 0.92) 100%);
    color: #00aaff;
  }

  .toast-warning {
    border-color: rgba(255, 170, 0, 0.8);
    background: linear-gradient(135deg, rgba(255, 170, 0, 0.15) 0%, rgba(0, 0, 0, 0.92) 100%);
    color: #ffaa00;
  }

  .toast-error {
    border-color: rgba(255, 0, 0, 0.8);
    background: linear-gradient(135deg, rgba(255, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.92) 100%);
    color: #ff6666;
  }

  .toast-content {
    flex: 1;
  }

  .toast-close {
    background: none;
    border: none;
    color: inherit;
    font-size: 1.5rem;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
    padding: 0;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .toast-close:hover {
    opacity: 1;
  }

  @media (max-width: 768px) {
    .toast-container {
      right: 1rem;
      /* max-width: none; */
      max-width: 20rem;
      bottom: 1rem;
    }

    .toast {
      font-size: 0.7rem;
      padding: 0.875rem 1rem;
    }
  }
</style>
