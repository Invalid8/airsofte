<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import PlayerPlane from './PlayerPlane.svelte'
  import EnemyPlane from './EnemyPlane.svelte'
  import GameHUD from './GameHUD.svelte'
  import Particles from './Particles.svelte'
  import PowerUps from './PowerUps.svelte'
  import ParallaxBackground from '../ParallaxBackground.svelte'
  import VictoryScreen from '../VictoryScreen.svelte'
  import ScorePopup from '../ScorePopup.svelte'
  import DialogueSystem from '../DialogueSystem.svelte'
  import MissionBriefing from '../MissionBriefing.svelte'
  import ToastNotification from '../ToastNotification.svelte'
  import { gameManager } from '../../lib/gameManager'
  import { storyMissionManager } from '../../lib/storyMissionData'
  import { gameEvents } from '../../lib/eventBus'
  import { syncGameState, navigateTo, gameState } from '../../stores/gameStore'
  import type { Bullet, StoryMission } from '../../types/gameTypes'

  let {
    mode = 'QUICK_PLAY',
    difficulty = 'Normal'
  }: {
    mode?: 'QUICK_PLAY' | 'STORY_MODE'
    difficulty?: 'Easy' | 'Normal' | 'Hard'
  } = $props()

  let game_pad: HTMLDivElement = $state()
  let playerBullets = $state<Bullet[]>([])
  let playerX = $state(0)
  let playerY = $state(0)
  let showVictory = $state(false)
  let gameEnded = $state(false)
  let currentMission = $state<StoryMission | null>(null)
  let showBriefing = $state(false)
  let missionStarted = $state(false)

  function handleGameOver(event): void {
    if (gameEnded) return
    gameEnded = true

    if (event.data?.victory === true && mode === 'STORY_MODE') {
      handleMissionComplete()
      showVictory = true
    } else {
      showVictory = false
      setTimeout(() => {
        navigateTo('GAME_OVER')
      }, 500)
    }
  }

  function handleMissionComplete(): void {
    if (currentMission) {
      storyMissionManager.completeMission(currentMission.id)

      const nextMission = storyMissionManager.getMissionById(currentMission.id + 1)
      if (nextMission) {
        storyMissionManager.unlockMission(nextMission.id)
      }
    }
  }

  function startMission(): void {
    if (!currentMission) return

    showBriefing = false
    missionStarted = true

    gameManager.startGame('STORY_MODE', difficulty, currentMission.id)
  }

  function cancelMission(): void {
    navigateTo('STORY_MODE_MENU')
  }

  onMount(() => {
    if (mode === 'STORY_MODE') {
      const missionId = $gameState.currentMissionId || 1
      currentMission = storyMissionManager.getMissionById(missionId)

      if (!currentMission) {
        navigateTo('STORY_MODE_MENU')
        return null
      }

      showBriefing = true
    } else {
      gameManager.startGame('QUICK_PLAY', difficulty)
      missionStarted = true
    }

    const unsubGameOver = gameEvents.on('GAME_OVER', handleGameOver)

    const syncInterval = setInterval(() => {
      if (!gameEnded && missionStarted) {
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

{#if mode === 'STORY_MODE' && showBriefing && currentMission}
  <MissionBriefing mission={currentMission} onStart={startMission} onCancel={cancelMission} />
{:else if showVictory}
  <VictoryScreen />
{:else if missionStarted}
  <GameHUD />
  <ToastNotification />

  {#if mode === 'STORY_MODE' && currentMission}
    <DialogueSystem mission={currentMission} />
  {/if}

  <div class="game-wrapper">
    <div class="game-container" bind:this={game_pad}>
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

<style>
  .game-wrapper {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .game-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: transparent;
  }

  @media (min-width: 1400px) {
    .game-container {
      max-width: 1200px;
      max-height: 100vh;
    }
  }
</style>
