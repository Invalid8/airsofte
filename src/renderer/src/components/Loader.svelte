<script lang="ts">
  import { onMount } from 'svelte'
  import { gsap } from 'gsap'

  export let progress: number | null = null
  export let percentage: number = 0
  export let steps: (() => Promise<void>)[] = []
  export let delayBetween = 100
  export let onComplete: () => void = () => {}

  let fill: HTMLDivElement

  async function runSteps(): Promise<void> {
    const total = steps.length
    for (let i = 0; i < total; i++) {
      await steps[i]()
      percentage = ((i + 1) / total) * 100
      gsap.to(fill, {
        width: `${percentage}%`,
        duration: 0.3,
        ease: 'power1.out'
      })
      await new Promise((res) => setTimeout(res, delayBetween))
    }
    onComplete()
  }

  onMount(() => {
    gsap.set(fill, { width: '0%' })

    if (progress !== null) {
      gsap.to(fill, {
        width: `${progress}%`,
        duration: 0.2,
        ease: 'linear'
      })
    }

    if (steps.length) runSteps()
  })
</script>

<div class="w-full">
  <div class="loader-container">
    <div class="loader-fill" bind:this={fill}></div>
  </div>
  <div class="loader-value">
    <span>{percentage | 0} %</span>
  </div>
</div>

<style>
  .loader-container {
    width: 100%;
    max-width: 400px;
    height: 28px;
    border: 2px solid #00bfff;
    border-radius: 99999px;
    padding: 3px;
    background: #000814;
    box-shadow: 0 0 12px #0077ff55;
    overflow: hidden;
    margin: 0.3rem auto;
  }

  .loader-fill {
    height: 100%;
    background: linear-gradient(90deg, #00bfff, #4facff);
    box-shadow:
      0 0 10px #00bfff,
      0 0 20px #0077ff inset;
    border-radius: 99999px;
  }

  .loader-value {
    color: #00bfff;
    font-size: 1.2rem;
    font-weight: bold;
    text-align: center;
    margin-top: 0.5rem;
  }
</style>
