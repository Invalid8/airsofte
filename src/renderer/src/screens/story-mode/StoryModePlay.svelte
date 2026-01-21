<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { navigateTo, syncGameState, gameState } from '../../stores/gameStore'
  import { storyMissionManager } from '../../lib/storyMissionData'
  import { gameManager } from '../../lib/gameManager'
  import { gameEvents } from '../../lib/eventBus'
  import PlayerPlane from '../../components/game/PlayerPlane.svelte'
  import EnemyPlane from '../../components/game/EnemyPlane.svelte'
  import GameHUD from '../../components/game/GameHUD.svelte'
  import Particles from '../../components/game/Particles.svelte'
  import PowerUps from '../../components/game/PowerUps.svelte'
  import ScorePopup from '../../components/ScorePopup.svelte'
  import DialogueSystem from '../../components/DialogueSystem.svelte'
  import MissionBriefing from '../../components/MissionBriefing.svelte'
  import ParallaxBackground from '../../components/ParallaxBackground.svelte'
  import BossHealthBar from '../../components/BossHealthBar.svelte'
  import VictoryScreen from '../../components/VictoryScreen.svelte'
  import WaveTransition from '../../components/WaveTransition.svelte'
  import type { Bullet, StoryMission } from '../../types/gameTypes'

  // Game state variables
  let game_pad: HTMLDivElement = $state()
  let playerBullets = $state<Bullet[]>([])
  let playerX = $state(0)
  let playerY = $state(0)
  let currentMission = $state<StoryMission | null>(null)
  let showBriefing = $state(true)
  let missionStarted = $state(false)
  let showVictory = $state(false)
  let gameEnded = $state(false)

  /**
   * ✅ FIX: Start mission after briefing
   * Properly initializes game manager with mission data
   */
  function startMission(): void {
    if (!currentMission) return

    showBriefing = false
    missionStarted = true

    // Start the game with the current mission
    gameManager.startGame('STORY_MODE', undefined, currentMission.id)
  }

  function cancelMission(): void {
    navigateTo('STORY_MODE_MENU')
  }

  function handleMissionComplete(): void {
    if (currentMission) {
      storyMissionManager.completeMission(currentMission.id)

      const nextMission = storyMissionManager.getMissionById(currentMission.id + 1)
      if (nextMission) {
        storyMissionManager.unlockMission(nextMission.id)
      }

      showVictory = true
    }
  }

  function handleGameOver(event): void {
    if (gameEnded) return
    gameEnded = true

    console.log('Story Mode Game Over:', event.data)

    if (event.data?.victory === true) {
      handleMissionComplete()
    } else {
      showVictory = false
      setTimeout(() => {
        navigateTo('GAME_OVER')
      }, 500)
    }
  }

  onMount(() => {
    const missionId = $gameState.currentMissionId || 1

    console.log('Loading Story Mission:', missionId)

    currentMission = storyMissionManager.getMissionById(missionId)

    if (!currentMission) {
      console.error('Mission not found:', missionId)
      navigateTo('STORY_MODE_MENU')
      return null
    }

    // Subscribe to game over event
    const unsubGameOver = gameEvents.on('GAME_OVER', handleGameOver)

    // Sync game state periodically
    const syncInterval = setInterval(() => {
      if (missionStarted && !gameEnded) {
        syncGameState()
      }
    }, 100)

    return () => {
      unsubGameOver()
      clearInterval(syncInterval)
    }
  })

  /**
   * Cleanup on component destroy
   */
  onDestroy(() => {
    if (gameManager.isPlaying) {
      gameManager.endGame(false)
    }
    gameEnded = false
    showVictory = false
  })
</script>

{#if showBriefing && currentMission}
  <MissionBriefing mission={currentMission} onStart={startMission} onCancel={cancelMission} />
{:else if showVictory}
  <VictoryScreen />
{:else if missionStarted && currentMission}
  <GameHUD />
  <DialogueSystem mission={currentMission} />
  <BossHealthBar />
  <WaveTransition />

  <div class="p-8 h-screen">
    <div
      class="w-full h-full rounded-lg overflow-hidden relative min-w-3xl"
      style="max-width: 900px; margin: 0 auto;"
      bind:this={game_pad}
    >
      {#if game_pad}
        <ParallaxBackground />
        <Particles />
        <PowerUps {game_pad} {playerX} {playerY} />
        <ScorePopup />
        <PlayerPlane {game_pad} bind:bullets={playerBullets} bind:x={playerX} bind:y={playerY} />
        <EnemyPlane {game_pad} bind:playerBullets {playerX} {playerY} />
      {/if}
    </div>
  </div>
{/if}
