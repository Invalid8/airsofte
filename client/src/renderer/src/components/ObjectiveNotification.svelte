<script lang="ts">
  import { gameEvents } from '../lib/eventBus'
  import { onMount } from 'svelte'
  import { fly, fade } from 'svelte/transition'

  type Notification = {
    id: string
    objective: { description: string; current: number; target: number }
    type: 'completed' | 'updated' | 'failed'
  }

  let notifications = $state<Notification[]>([])

  onMount(() => {
    const unsubCompleted = gameEvents.on('OBJECTIVE_COMPLETED', (event) => {
      const notification: Notification = {
        id: `obj-${Date.now()}`,
        objective: event.data.objective,
        type: 'completed'
      }

      notifications = [...notifications, notification]

      setTimeout(() => {
        notifications = notifications.filter((n) => n.id !== notification.id)
      }, 5000)
    })

    const unsubUpdated = gameEvents.on('OBJECTIVE_UPDATED', (event) => {
      if (event.data.progress >= 100) return // Don't show update if completing

      const notification: Notification = {
        id: `obj-upd-${Date.now()}`,
        objective: event.data.objective,
        type: 'updated'
      }

      notifications = [...notifications, notification]

      setTimeout(() => {
        notifications = notifications.filter((n) => n.id !== notification.id)
      }, 3000)
    })

    const unsubFailed = gameEvents.on('OBJECTIVE_FAILED', (event) => {
      const notification: Notification = {
        id: `obj-fail-${Date.now()}`,
        objective: event.data.objective,
        type: 'failed'
      }

      notifications = [...notifications, notification]

      setTimeout(() => {
        notifications = notifications.filter((n) => n.id !== notification.id)
      }, 5000)
    })

    return () => {
      unsubCompleted()
      unsubUpdated()
      unsubFailed()
    }
  })
</script>

<div class="objective-notifications">
  {#each notifications as notification (notification.id)}
    <div
      class="notification"
      class:completed={notification.type === 'completed'}
      class:updated={notification.type === 'updated'}
      class:failed={notification.type === 'failed'}
      in:fly={{ x: 300, duration: 300 }}
      out:fade={{ duration: 200 }}
    >
      <div class="notification-icon">
        {#if notification.type === 'completed'}
          ✓
        {:else if notification.type === 'failed'}
          ✗
        {:else}
          📊
        {/if}
      </div>
      <div class="notification-content">
        <div class="notification-title">
          {#if notification.type === 'completed'}
            Objective Complete!
          {:else if notification.type === 'failed'}
            Objective Failed
          {:else}
            Objective Progress
          {/if}
        </div>
        <div class="notification-text">
          {notification.objective.description}
        </div>
        {#if notification.type !== 'failed'}
          <div class="notification-progress">
            {notification.objective.current}/{notification.objective.target}
          </div>
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
  .objective-notifications {
    position: fixed;
    top: 100px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    pointer-events: none;
    max-width: 320px;
  }

  .notification {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid;
    border-radius: 0.75rem;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  }

  .notification.completed {
    border-color: #00ff88;
    background: linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 170, 255, 0.1));
  }

  .notification.updated {
    border-color: #00aaff;
    background: linear-gradient(135deg, rgba(0, 170, 255, 0.2), rgba(0, 255, 136, 0.1));
  }

  .notification.failed {
    border-color: #ff6666;
    background: linear-gradient(135deg, rgba(255, 102, 102, 0.2), rgba(255, 0, 0, 0.1));
  }

  .notification-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }

  .notification.completed .notification-icon {
    color: #00ff88;
    text-shadow: 0 0 10px #00ff88;
  }

  .notification.updated .notification-icon {
    color: #00aaff;
  }

  .notification.failed .notification-icon {
    color: #ff6666;
    text-shadow: 0 0 10px #ff6666;
  }

  .notification-content {
    flex: 1;
  }

  .notification-title {
    font-size: 0.875rem;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 0.25rem;
    opacity: 0.9;
  }

  .notification.completed .notification-title {
    color: #00ff88;
  }

  .notification.updated .notification-title {
    color: #00aaff;
  }

  .notification.failed .notification-title {
    color: #ff6666;
  }

  .notification-text {
    font-size: 0.875rem;
    opacity: 0.85;
    line-height: 1.4;
  }

  .notification-progress {
    font-size: 0.75rem;
    margin-top: 0.25rem;
    opacity: 0.7;
    font-family: 'VT323', monospace;
  }

  @media (max-width: 768px) {
    .objective-notifications {
      top: 80px;
      right: 10px;
      left: 10px;
      max-width: none;
    }

    .notification {
      padding: 0.75rem 1rem;
    }

    .notification-icon {
      font-size: 1.5rem;
    }
  }
</style>
