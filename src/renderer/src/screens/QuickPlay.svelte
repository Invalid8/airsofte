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
  import { startQuickPlay, gameState, syncGameState, navigateTo } from '../stores/gameStore'
  import { gameEvents } from '../lib/eventBus'
  import { gameManager } from '../lib/gameManager'
  import type { Bullet } from '../types/gameTypes'

  let game_pad: HTMLDivElement = $state()
  let playerBullets = $state<Bullet[]>([])
  let playerX = $state(0)
  let playerY = $state(0)
  let showVictory = $state(false)
  let gameEnded = $state(false)

  function handleGameOver(event): void {
    if (gameEnded) return
    gameEnded = true

    if (event.data?.victory === true) {
      showVictory = true
    } else {
      showVictory = false
      setTimeout(() => {
        navigateTo('GAME_OVER')
      }, 500)
    }
  }

  onMount(() => {
    startQuickPlay($gameState.difficulty)

    const unsubGameOver = gameEvents.on('GAME_OVER', handleGameOver)

    const syncInterval = setInterval(() => {
      if (!gameEnded) {
        syncGameState()
      }
    }, 100)

    return () => {
      unsubGameOver()
      clearInterval(syncInterval)
    }
  })

  onDestroy(() => {
    if (gameManager.isPlaying) {
      gameManager.endGame(false)
    }
    gameEnded = false
    showVictory = false
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
      class="border-p border-white/50 w-full h-full rounded-lg bg-white/4 overflow-hidden relative min-w-3xl"
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
