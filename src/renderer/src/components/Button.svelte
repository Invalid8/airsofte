<script lang="ts">
  import { gsap } from 'gsap'
  import { onMount } from 'svelte'
  import { audioManager } from '../utils/AudioManager'
  export let label: string | HTMLElement = 'START'
  export let onClick: () => void
  export let isFirst: boolean = false
  export let buttonRef: HTMLButtonElement | null = null
  let button: HTMLButtonElement

  $: if (button) {
    buttonRef = button
  }

  const applyHoverEffect = (): void => {
    gsap.to(button, { scale: 1.05, duration: 0.15, ease: 'power1.out' })
    gsap.to(button.previousElementSibling, { opacity: 1, duration: 0.2 })
  }

  const removeHoverEffect = (): void => {
    gsap.to(button, { scale: 1, duration: 0.15, ease: 'power1.in' })
    gsap.to(button.previousElementSibling, { opacity: 0.5, duration: 0.2 })
  }

  const handleMouseEnter = (): void => {
    applyHoverEffect()
  }

  const handleMouseLeave = (): void => {
    if (document.activeElement !== button) {
      removeHoverEffect()
    }
  }

  const handleFocus = (): void => {
    applyHoverEffect()
  }

  const handleBlur = (): void => {
    removeHoverEffect()
  }

  const handleClick = (): void => {
    gsap.to(button, {
      backgroundColor: '#00ccff',
      duration: 0.1,
      onComplete: () => {
        gsap.to(button, { backgroundColor: '#0066cc', duration: 0.1 })
      }
    })
    gsap.to(button, { y: 3, duration: 0.1, yoyo: true, repeat: 1 })
    audioManager.playSound('menuClick')
    onClick?.()
  }

  onMount(() => {
    if (isFirst) {
      button.focus()
    }
  })
</script>

<div class="button-container">
  <div class="button-glow"></div>
  <button
    bind:this={button}
    on:mouseenter={handleMouseEnter}
    on:mouseleave={handleMouseLeave}
    on:focus={handleFocus}
    on:blur={handleBlur}
    on:click={handleClick}
    {...$$restProps}
  >
    {#if label}
      {label}
    {/if}
    <slot></slot>
  </button>
</div>

<style>
  .button-container {
    position: relative;
    display: inline-block;
    margin: 10px;
  }

  .button-glow {
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    background: transparent;
    border: 2px solid #00ccff;
    border-radius: 8px;
    opacity: 0.5;
    box-shadow:
      0 0 10px #00ccff,
      0 0 20px rgba(0, 204, 255, 0.5);
    z-index: 0;
  }

  button {
    position: relative;
    background-color: #0066cc;
    border: 3px solid #00aaff;
    border-radius: 4px;
    color: #ffffff;
    font-family: 'Press Start 2P', 'Courier New', monospace;
    font-size: 0.8rem;
    font-weight: normal;
    word-spacing: -10px;
    padding: 10px 20px;
    cursor: pointer;
    letter-spacing: 2px;
    text-shadow: 2px 2px 0px #004488;
    box-shadow:
      inset 0px -4px 0px #004488,
      0px 4px 0px #003366,
      0px 8px 8px rgba(0, 0, 0, 0.5);
    text-transform: uppercase;
    z-index: 1;
    outline: none;
  }

  button:hover {
    background-color: #0077dd;
  }

  button:active {
    box-shadow:
      inset 0px -2px 0px #004488,
      0px 2px 0px #003366,
      0px 4px 6px rgba(0, 0, 0, 0.5);
    text-shadow: 1px 1px 0px #004488;
  }

  button:focus {
    background-color: #0077dd;
  }
</style>
