<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { GameRuntime } from '$lib/game/gameRuntime'

  let {
    game_pad
  }: {
    game_pad: HTMLDivElement
  } = $props()

  let runtime: GameRuntime | null = null

  onMount(() => {
    runtime = new GameRuntime(game_pad)
    runtime.start()
  })

  onDestroy(() => {
    runtime?.stop()
  })
</script>
