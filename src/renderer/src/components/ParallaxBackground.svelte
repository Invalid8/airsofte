<script lang="ts">
  import { onMount, onDestroy } from 'svelte'

  let layer1Y = $state(0)
  let layer2Y = $state(0)
  let layer3Y = $state(0)
  let animationFrameId: number

  const speeds = {
    layer1: 0.3,
    layer2: 0.6,
    layer3: 1.0
  }

  function updateParallax(): void {
    layer1Y += speeds.layer1
    layer2Y += speeds.layer2
    layer3Y += speeds.layer3

    if (layer1Y >= 100) layer1Y = 0
    if (layer2Y >= 100) layer2Y = 0
    if (layer3Y >= 100) layer3Y = 0

    animationFrameId = requestAnimationFrame(updateParallax)
  }

  onMount(() => {
    animationFrameId = requestAnimationFrame(updateParallax)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  })

  onDestroy(() => {
    cancelAnimationFrame(animationFrameId)
  })
</script>

<div class="parallax-container absolute inset-0 overflow-hidden pointer-events-none">
  <div class="parallax-layer layer-1" style="transform: translateY({layer1Y}%)">
    <div class="stars stars-small"></div>
  </div>

  <div class="parallax-layer layer-2" style="transform: translateY({layer2Y}%)">
    <div class="stars stars-medium"></div>
  </div>

  <div class="parallax-layer layer-3" style="transform: translateY({layer3Y}%)">
    <div class="stars stars-large"></div>
  </div>
</div>

<style>
  .parallax-container {
    z-index: 0;
    /* background: linear-gradient(180deg, #00042849 0%, #001a3d59 100%); */
  }

  .parallax-layer {
    position: absolute;
    width: 100%;
    height: 200%;
    top: -100%;
  }

  .stars {
    width: 100%;
    height: 100%;
    background-repeat: repeat;
  }

  .stars-small {
    background-image:
      radial-gradient(circle, white 2px, transparent 2px),
      radial-gradient(circle, white 2px, transparent 2px),
      radial-gradient(circle, white 1px, transparent 1px);
    background-size:
      400px 400px,
      600px 600px,
      800px 800px;
    background-position:
      0 0,
      100px 100px,
      200px 200px;
    opacity: 0.6;
  }

  .stars-medium {
    background-image:
      radial-gradient(circle, rgba(255, 255, 255, 0.9) 2.5px, transparent 2.5px),
      radial-gradient(circle, rgba(255, 255, 255, 0.8) 2px, transparent 2px);
    background-size:
      500px 500px,
      700px 700px;
    background-position:
      50px 50px,
      250px 250px;
    opacity: 0.7;
  }

  .stars-large {
    background-image:
      radial-gradient(circle, rgba(100, 200, 255, 1) 3px, transparent 3px),
      radial-gradient(circle, rgba(150, 220, 255, 0.9) 3.5px, transparent 3.5px);
    background-size:
      600px 600px,
      900px 900px;
    background-position:
      150px 150px,
      350px 350px;
    opacity: 1;
    animation: twinkle 4s ease-in-out infinite;
  }

  @keyframes twinkle {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }
</style>
