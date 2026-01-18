<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import PlayerPlane from '../components/game/PlayerPlane.svelte'
  import EnemyPlane from '../components/game/EnemyPlane.svelte'
  import GameHUD from '../components/game/GameHUD.svelte'
  import Particles from '../components/game/Particles.svelte'
  import PowerUps from '../components/game/PowerUps.svelte'
  import WaveTransition from '../components/WaveTransition.svelte'
  import ParallaxBackground from '../components/ParallaxBackground.svelte'
  import BossHealthBar from '../components/BossHealthBar.svelte'
  import VictoryScreen from '../components/VictoryScreen.svelte'
  import { BgSound1 } from '../lib/sounds'
  import { startQuickPlay, gameState, togglePause, syncGameState } from '../stores/gameStore'
  import { gameEvents } from '../lib/eventBus'
  import type { Bullet } from '../types/gameTypes'

  let game_pad: HTMLDivElement = $state()
  let playerBullets = $state<Bullet[]>([])
  let playerX = $state(0)
  let playerY = $state(0)
  let showVictory = $state(false)

  const bgSound1 = BgSound1()

  function handleGameOver(event): void {
    if (event.data.victory) {
      showVictory = true
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      togglePause()
    }
  }

  onMount(() => {
    bgSound1.play()
    startQuickPlay($gameState.difficulty)

    window.addEventListener('keydown', handleKeyDown)

    const unsubGameOver = gameEvents.on('GAME_OVER', handleGameOver)

    const syncInterval = setInterval(() => {
      syncGameState()
    }, 100)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      unsubGameOver()
      clearInterval(syncInterval)
    }
  })

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeyDown)
    bgSound1.pause()
  })
</script>

{#if showVictory}
  <VictoryScreen />
{:else}
  <GameHUD />
  <WaveTransition />
  <BossHealthBar />

  <div class="p-8 h-svh">
    <div
      class="border-2 border-white/50 w-full h-full rounded-lg bg-white/4 overflow-hidden relative min-w-3xl"
      style="max-width: 900px; margin: 0 auto;"
      bind:this={game_pad}
    >
      {#if game_pad}
        <ParallaxBackground />
        <Particles />
        <PowerUps {game_pad} {playerX} {playerY} />
        <PlayerPlane {game_pad} bind:bullets={playerBullets} bind:x={playerX} bind:y={playerY} />
        <EnemyPlane {game_pad} bind:playerBullets {playerX} {playerY} />
      {/if}
    </div>
  </div>
{/if}
