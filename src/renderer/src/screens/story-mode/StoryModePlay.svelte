<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { navigateTo } from '../../stores/gameStore'
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
  import type { Bullet, StoryMission } from '../../types/gameTypes'

  let game_pad: HTMLDivElement = $state()
  let playerBullets = $state<Bullet[]>([])
  let playerX = $state(0)
  let playerY = $state(0)
  let currentMission = $state<StoryMission | null>(null)
  let showBriefing = $state(true)
  let missionStarted = $state(false)

  onMount(() => {
    currentMission = storyMissionManager.getMissionById(1)

    if (!currentMission) {
      navigateTo('STORY_MODE_MENU')
      return
    }
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

      setTimeout(() => {
        navigateTo('STORY_MODE_MENU')
      }, 3000)
    }
  }

  onMount(() => {
    const unsubMissionComplete = gameEvents.on('MISSION_COMPLETE', handleMissionComplete)

    return () => {
      unsubMissionComplete()
    }
  })

  onDestroy(() => {
    if (gameManager.isPlaying) {
      gameManager.endGame(false)
    }
  })
</script>

{#if showBriefing && currentMission}
  <MissionBriefing mission={currentMission} onStart={startMission} onCancel={cancelMission} />
{:else if missionStarted && currentMission}
  <GameHUD />
  <DialogueSystem mission={currentMission} />

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
{/if}
