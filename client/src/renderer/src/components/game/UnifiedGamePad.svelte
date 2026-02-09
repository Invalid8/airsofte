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
  import TacticalHints from '../TacticalHints.svelte'
  import GameCommentary from '../GameCommentary.svelte'
  import { gameManager } from '../../lib/gameManager'
  import { storyMissionManager } from '../../lib/storyMissionData'
  import { gameEvents } from '../../lib/eventBus'
  import { objectiveTracker } from '../../lib/objectiveTracker'
  import { syncGameState, navigateTo, gameState } from '../../stores/gameStore'
  import type { Bullet, StoryMission } from '../../types/gameTypes'
  import ShieldEffect from './ShieldEffect.svelte'

  let {
    mode = 'QUICK_PLAY',
    difficulty = 'Normal'
  }: {
    mode?: 'QUICK_PLAY' | 'STORY_MODE' | 'AI_MISSION_PLAY'
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
  let sessionId = $state('')
  let cleanupPhaseActive = $state(false)

  function handleGameOver(event): void {
    if (gameEnded) return
    gameEnded = true

    if (event.data?.victory === true && mode === 'STORY_MODE') {
      handleMissionComplete()

      setTimeout(() => {
        showVictory = true
      }, 1000)
    } else {
      showVictory = false
      setTimeout(() => {
        navigateTo('GAME_OVER')
      }, 1500)
    }
  }

  function handleMissionComplete(): void {
    if (!currentMission) return

    const allComplete = objectiveTracker.areAllObjectivesComplete()

    if (allComplete) {
      gameEvents.emit('SHOW_MESSAGE', {
        text: '✓ MISSION COMPLETE',
        color: '#00ff88',
        duration: 3000
      })

      setTimeout(() => {
        storyMissionManager.completeMission(currentMission.id)

        const nextMission = storyMissionManager.getMissionById(currentMission.id + 1)
        if (nextMission) {
          storyMissionManager.unlockMission(nextMission.id)
        }
      }, 500)
    }
  }

  function handleSurviveObjectiveComplete(): void {
    cleanupPhaseActive = true

    setTimeout(() => {
      cleanupPhaseActive = false
      gameManager.endGame(true)
    }, 5000)
  }

  function startCleanupPhase(onComplete: () => void) {
    setTimeout(() => {
      onComplete()
    }, 5000)
  }

  function startMission(): void {
    if (!currentMission) return

    showBriefing = false
    missionStarted = true

    objectiveTracker.startMission(currentMission)
    gameManager.startGame('STORY_MODE', difficulty, currentMission.id)
  }

  function cancelMission(): void {
    navigateTo('STORY_MODE_MENU')
  }

  onMount(() => {
    sessionId = crypto.randomUUID()

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

    const unsubSurviveComplete = gameEvents.on(
      'SURVIVE_OBJECTIVE_COMPLETE',
      handleSurviveObjectiveComplete
    )

    const unsubObjectiveCompleted = gameEvents.on('OBJECTIVE_COMPLETED', (event) => {
      const obj = event.data.objective
      gameEvents.emit('SHOW_MESSAGE', {
        text: `✓ ${obj.description}`,
        color: '#00ff88',
        duration: 4000
      })
    })

    const unsubObjectiveUpdated = gameEvents.on('OBJECTIVE_UPDATED', (event) => {
      const obj = event.data.objective
      const progress = event.data.progress

      if (progress >= 100) return

      if (progress >= 50 && progress < 100) {
        gameEvents.emit('SHOW_MESSAGE', {
          text: `${obj.description}: ${obj.current}/${obj.target}`,
          color: '#00aaff',
          duration: 2000
        })
      }
    })

    const unsubObjectiveFailed = gameEvents.on('OBJECTIVE_FAILED', (event) => {
      const obj = event.data.objective
      gameEvents.emit('SHOW_MESSAGE', {
        text: `✗ ${obj.description} FAILED`,
        color: '#ff6666',
        duration: 5000
      })
    })

    const unsubWaveComplete = gameEvents.on('WAVE_COMPLETE', (event) => {
      if (cleanupPhaseActive) return

      const { wave } = event.data
      const mission = currentMission

      if (objectiveTracker.hasSurviveObjective() && objectiveTracker.isSurviveTimerActive()) {
        return
      }

      if (mission && wave >= mission.waves.length) {
        cleanupPhaseActive = true
        startCleanupPhase(() => {
          cleanupPhaseActive = false
          gameManager.endGame(true)
        })
      }
    })

    const syncInterval = setInterval(() => {
      if (!gameEnded && missionStarted) {
        syncGameState()
        if (mode === 'STORY_MODE') {
          objectiveTracker.checkSurviveObjective()
        }
      }
    }, 100)

    return () => {
      unsubGameOver()
      unsubSurviveComplete()
      unsubObjectiveCompleted()
      unsubObjectiveUpdated()
      unsubObjectiveFailed()
      unsubWaveComplete()
      clearInterval(syncInterval)
    }
  })

  onDestroy(() => {
    if (gameManager.isPlaying) {
      gameManager.endGame(false)
    }
    objectiveTracker.reset()
    gameEnded = false
    showVictory = false
    cleanupPhaseActive = false
  })
</script>

{#if mode === 'STORY_MODE' && showBriefing && currentMission}
  <MissionBriefing mission={currentMission} onStart={startMission} onCancel={cancelMission} />
{:else if showVictory}
  <VictoryScreen />
{:else if missionStarted}
  <GameHUD />

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
        <ShieldEffect x={playerX + 75} y={playerY + 75} />
        <EnemyPlane {game_pad} bind:playerBullets {playerX} {playerY} />
      {/if}
    </div>
  </div>
  {#if game_pad}
    <TacticalHints {sessionId} />
    <GameCommentary {sessionId} />
  {/if}
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
