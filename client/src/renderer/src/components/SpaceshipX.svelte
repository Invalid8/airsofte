<script lang="ts">
  import { onMount } from 'svelte'
  import { gsap } from 'gsap'
  import PlayerShip from '../assets/sprites/player-ship-i.png'
  export let opp: boolean = false

  let ship: HTMLImageElement

  onMount(() => {
    const startX = opp ? window.innerWidth : -window.innerWidth
    const endX = opp ? -window.innerWidth : window.innerWidth
    const currentRotation: number = opp ? 270 : 90

    gsap.fromTo(
      ship,
      { x: startX, rotate: currentRotation },
      {
        x: endX,
        duration: 3,
        repeat: -1,
        ease: 'none'
      }
    )
  })
</script>

<img bind:this={ship} class="ship" src={PlayerShip} alt="Player Ship" />

<style>
  .ship {
    width: 100px;
    height: auto;
  }
</style>
