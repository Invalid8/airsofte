<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { particleSystem } from '../../lib/particleSystem'
  import type { Particle } from '../../lib/particleSystem'

  let particles = $state<Particle[]>([])
  let animationFrameId: number

  function update(): void {
    particleSystem.update(16)
    particles = particleSystem.getActiveParticles()
    animationFrameId = requestAnimationFrame(update)
  }

  onMount(() => {
    animationFrameId = requestAnimationFrame(update)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  })

  onDestroy(() => {
    cancelAnimationFrame(animationFrameId)
    particleSystem.clear()
  })
</script>

{#each particles as particle (particle.id)}
  <div
    class="particle absolute pointer-events-none rounded-full"
    style="
      left: {particle.x}px;
      top: {particle.y}px;
      width: {particle.size}px;
      height: {particle.size}px;
      background-color: {particle.color};
      opacity: {particle.life};
    "
  ></div>
{/each}

<style>
  .particle {
    will-change: transform;
  }
</style>
