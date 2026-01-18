<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { navigateTo, togglePause } from '../../stores/gameStore'
  import { storyMissionManager } from '../../lib/storyMissionData'
  import { gameManager } from '../../lib/gameManager'
  import { gameEvents } from '../../lib/eventBus'
  import PlayerPlane from '../../components/game/PlayerPlane.svelte'
  import EnemyPlane from '../../components/game/EnemyPlane.svelte'
  import GameHUD from '../../components/game/GameHUD.svelte'
  import Particles from '../../components/game/Particles.svelte'
  import PowerUps from '../../components/game/PowerUps.svelte'
  import DialogueSystem from '../../components/DialogueSystem.svelte'
  import MissionBriefing from '../../components/MissionBriefing.svelte'
  import ParallaxBackground from '../../components/ParallaxBackground.svelte'
  import BossHealthBar from '../../components/BossHealthBar.svelte'
  import VictoryScreen from '../../components/VictoryScreen.svelte'
  import type { Bullet, StoryMission } from '../../types/gameTypes'

  let game_pad: HTMLDivElement = $state()
  let playerBullets = $state<Bullet[]>([])
  let playerX = $state(0)
  let playerY = $state(0)
  let currentMission = $state<StoryMission | null>(null)
  let showBriefing = $state(true)
  let missionStarted = $state(false)
  let showVictory = $state(false)

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && missionStarted) {
      event.preventDefault()
      togglePause()
    }
  }

  onMount(() => {
    currentMission = storyMissionManager.getMissionById(1)

    if (!currentMission) {
      navigateTo('STORY_MODE_MENU')
      return
    }

    window.addEventListener('keydown', handleKeyDown)
  })

  function startMission(): void {
    if (!currentMission) return

    showBriefing = false
    missionStarted = true
    gameManager.startGame('STORY_MODE')
  }

  function cancelMission(): void {
    navigateTo('STORY_MODE_MENU')
  }

  function handleMissionComplete(): void {
    if (currentMission) {
      storyMissionManager.completeMission(currentMission.id)
      showVictory = true
    }
  }

  function handleGameOver(event): void {
    if (event.data.victory) {
      handleMissionComplete()
    }
  }

  onMount(() => {
    const unsubMissionComplete = gameEvents.on('MISSION_COMPLETE', handleMissionComplete)
    const unsubGameOver = gameEvents.on('GAME_OVER', handleGameOver)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      unsubMissionComplete()
      unsubGameOver()
    }
  })

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeyDown)
    if (gameManager.isPlaying) {
      gameManager.endGame(false)
    }
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
