<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import PlayerPlane from '../components/game/PlayerPlane.svelte'
  import EnemyPlane from '../components/game/EnemyPlane.svelte'
  import GameHUD from '../components/game/GameHUD.svelte'
  import Particles from '../components/game/Particles.svelte'
  import PowerUps from '../components/game/PowerUps.svelte'
  import WaveTransition from '../components/WaveTransition.svelte'
  import { BgSound1 } from '../lib/sounds'
  import { startQuickPlay, gameState } from '../stores/gameStore'
  import type { Bullet } from '../types/gameTypes'

  let game_pad: HTMLDivElement = $state()
  let playerBullets = $state<Bullet[]>([])
  let playerX = $state(0)
  let playerY = $state(0)

  const bgSound1 = BgSound1()

  onMount(() => {
    bgSound1.play()
    startQuickPlay($gameState.difficulty)
  })

  onDestroy(() => {
    bgSound1.pause()
  })
</script>

<GameHUD />
<WaveTransition />

<div class="p-8 h-svh">
  <div
    class="border-2 border-white/50 w-full min-w-3xl max-w-4xl mx-auto h-full rounded-lg bg-white/4 overflow-hidden relative"
    bind:this={game_pad}
  >
    {#if game_pad}
      <Particles />
      <PowerUps {game_pad} {playerX} {playerY} />
      <PlayerPlane {game_pad} bind:bullets={playerBullets} bind:x={playerX} bind:y={playerY} />
      <EnemyPlane {game_pad} bind:playerBullets {playerX} {playerY} />
    {/if}
  </div>
</div>
