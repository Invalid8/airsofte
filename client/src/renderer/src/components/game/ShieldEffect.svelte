<script lang="ts">
  import { gameManager } from '../../lib/gameManager'

  let {
    x = 0,
    y = 0
  }: {
    x?: number
    y?: number
  } = $props()

  let isActive = $derived(gameManager.player.shieldActive)
</script>

{#if isActive}
  <div class="shield-effect" style="left: {x - 25}px; top: {y - 25}px;"></div>
{/if}

<style>
  .shield-effect {
    position: absolute;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    border: 3px solid rgba(0, 136, 255, 0.6);
    background: radial-gradient(
      circle,
      rgba(0, 136, 255, 0.15) 0%,
      rgba(0, 200, 255, 0.05) 50%,
      transparent 100%
    );
    box-shadow:
      0 0 20px rgba(0, 136, 255, 0.4),
      inset 0 0 30px rgba(0, 200, 255, 0.2);
    pointer-events: none;
    animation: shield-pulse 1.5s ease-in-out infinite;
    z-index: 5;
  }

  @keyframes shield-pulse {
    0%,
    100% {
      transform: scale(1);
      opacity: 0.8;
      box-shadow:
        0 0 20px rgba(0, 136, 255, 0.4),
        inset 0 0 30px rgba(0, 200, 255, 0.2);
    }
    50% {
      transform: scale(1.05);
      opacity: 1;
      box-shadow:
        0 0 30px rgba(0, 136, 255, 0.6),
        inset 0 0 40px rgba(0, 200, 255, 0.3);
    }
  }
</style>
