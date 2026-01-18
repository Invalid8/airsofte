<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import PlayerPlane from '../components/game/PlayerPlane.svelte'
  import { BgSound1 } from '../lib/sounds'
  import EnemyPlane from '../components/game/EnemyPlane.svelte'

  let game_pad: HTMLDivElement
  const bgSound1 = BgSound1()

  onMount(() => {
    bgSound1.play()
  })

  onDestroy(() => {
    bgSound1.pause()
  })
</script>

<div class="p-8 h-svh">
  <div
    class="border-2 border-white/50 w-full max-w-md min-w-3xl h-full rounded-lg bg-white/4 overflow-hidden relative"
    bind:this={game_pad}
  >
    <PlayerPlane {game_pad} />

    <EnemyPlane {game_pad} />
  </div>
</div>

<style>
</style>
