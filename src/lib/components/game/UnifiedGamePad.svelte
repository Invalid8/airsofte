<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import GameHUD from './GameHUD.svelte'
  import GameCanvasLayer from './GameCanvasLayer.svelte'
  import GameRuntimeHost from './GameRuntimeHost.svelte'
  import VictoryScreen from '../VictoryScreen.svelte'
  import ScorePopup from '../ScorePopup.svelte'
  import DialogueSystem from '../DialogueSystem.svelte'
  import MissionBriefing from '../MissionBriefing.svelte'
  import ToastNotification from '../ToastNotification.svelte'
  import { gameManager } from '$lib/game/gameManager'
  import { storyMissionManager } from '$lib/game/storyMissionData'
  import { gameEvents } from '$lib/game/eventBus'
  import { syncGameState, navigateTo, gameState } from '$lib/stores/gameStore'
  import type { Bullet, Enemy, GameEvent, PowerUp, StoryMission } from '$lib/types/gameTypes'

  let {
    mode = 'QUICK_PLAY',
    difficulty = 'Normal'
  }: {
    mode?: 'QUICK_PLAY' | 'STORY_MODE'
    difficulty?: 'Easy' | 'Normal' | 'Hard'
  } = $props()

  let game_pad = $state<HTMLDivElement>()
  let playerBullets = $state<Bullet[]>([])
  let enemyBullets = $state<Bullet[]>([])
  let enemies = $state<Enemy[]>([])
  let powerUps = $state<PowerUp[]>([])
  let playerX = $state(0)
  let playerY = $state(0)
  let playerOpacity = $state(1)
  let playerScale = $state(1)
  let playerRotation = $state(0)
  let playerOffsetY = $state(0)
  let playerInvincible = $state(false)
  let showVictory = $state(false)
  let gameEnded = $state(false)
  let currentMission = $state<StoryMission | null>(null)
  let showBriefing = $state(false)
  let missionStarted = $state(false)

  function handleGameOver(event: GameEvent): void {
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
      const mission = storyMissionManager.getMissionById(missionId)

      if (!mission) {
        navigateTo('STORY_MODE_MENU')
        return
      }

      currentMission = mission
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
        <GameCanvasLayer
          {game_pad}
          {playerBullets}
          {enemyBullets}
          {enemies}
          {powerUps}
          {playerX}
          {playerY}
          {playerOpacity}
          {playerScale}
          {playerRotation}
          {playerOffsetY}
          {playerInvincible}
        />
        <ScorePopup />
        <GameRuntimeHost
          {game_pad}
          bind:playerBullets
          bind:enemyBullets
          bind:enemies
          bind:powerUps
          bind:playerX
          bind:playerY
          bind:playerOpacity
          bind:playerScale
          bind:playerRotation
          bind:playerOffsetY
          bind:playerInvincible
        />
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
