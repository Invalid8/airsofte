<script lang="ts">
  import { gameEvents } from '../lib/eventBus'
  import { onMount } from 'svelte'
  import { fly, fade } from 'svelte/transition'

  type Message = {
    id: string
    text: string
    color: string
    duration: number
  }

  let messages = $state<Message[]>([])

  onMount(() => {
    const unsubscribe = gameEvents.on('SHOW_MESSAGE', (event) => {
      const message: Message = {
        id: `msg-${Date.now()}-${Math.random()}`,
        text: event.data.text,
        color: event.data.color || '#00aaff',
        duration: event.data.duration || 3000
      }

      messages = [...messages, message]

      setTimeout(() => {
        messages = messages.filter((m) => m.id !== message.id)
      }, message.duration)
    })

    return () => {
      unsubscribe()
    }
  })
</script>

<div class="message-display">
  {#each messages as message (message.id)}
    <div
      class="message"
      style="border-color: {message.color}; box-shadow: 0 0 20px {message.color}40;"
      in:fly={{ y: -50, duration: 400 }}
      out:fade={{ duration: 300 }}
    >
      <div class="message-glow" style="background: {message.color}20;"></div>
      <div class="message-text" style="color: {message.color};">
        {message.text}
      </div>
    </div>
  {/each}
</div>

<style>
  .message-display {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 9998;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    pointer-events: none;
    width: 90%;
    max-width: 600px;
  }

  .message {
    position: relative;
    padding: 1.5rem 2rem;
    background: rgba(0, 0, 0, 0.95);
    border: 3px solid;
    border-radius: 1rem;
    backdrop-filter: blur(10px);
    overflow: hidden;
  }

  .message-glow {
    position: absolute;
    inset: 0;
    opacity: 0.3;
    animation: pulse-glow 2s ease-in-out infinite;
  }

  @keyframes pulse-glow {
    0%,
    100% {
      opacity: 0.2;
    }
    50% {
      opacity: 0.4;
    }
  }

  .message-text {
    position: relative;
    font-size: 1.5rem;
    font-weight: bold;
    text-align: center;
    text-shadow: 0 0 10px currentColor;
    font-family: 'Press Start 2P', cursive;
    line-height: 1.6;
    word-spacing: -5px;
  }

  @media (max-width: 768px) {
    .message-display {
      width: 95%;
      max-width: none;
    }

    .message {
      padding: 1rem 1.5rem;
    }

    .message-text {
      font-size: 1rem;
      line-height: 1.5;
    }
  }

  @media (max-width: 480px) {
    .message-text {
      font-size: 0.75rem;
      word-spacing: -3px;
    }
  }
</style>
