<script lang="ts">
  import { particleSystem, type Particle } from '$lib/game/particleSystem'
  import { onMount, onDestroy } from 'svelte'

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
      box-shadow: 0 0 {particle.size * 2}px {particle.color};
    "
  ></div>
{/each}

<style>
  .particle {
    transition: opacity 0.05s linear;
  }
</style>
