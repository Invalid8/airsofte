<script lang="ts">
  import { onMount } from 'svelte'
  import { navigateTo } from '../../stores/gameStore'
  import { storyMissionManager } from '../../lib/storyMissionData'
  import type { StoryMission } from '../../types/gameTypes'

  let missions = $state<StoryMission[]>([])

  onMount(() => {
    missions = storyMissionManager.getMissions()
  })

  function startMission(mission: StoryMission): void {
    if (!mission.unlocked) return

    navigateTo('STORY_MODE_PLAY')
  }

  function getMissionStatus(mission: StoryMission): string {
    if (mission.completed) return '✓ COMPLETED'
    if (mission.unlocked) return 'AVAILABLE'
    return '🔒 LOCKED'
  }

  function getMissionClass(mission: StoryMission): string {
    if (!mission.unlocked) return 'locked'
    if (mission.completed) return 'completed'
    return 'available'
  }
</script>

<div class="flex size-full h-svh flex-col gap-4 text-center p-6 items-center pt-10">
  <h1 class="title text-4xl uppercase glow-text pb-4">Story Mode</h1>

  <div
    class="scroll size-full overflow-auto max-h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 place-content-start place-items-center w-full gap-6 px-5 pb-10"
  >
    {#each missions as mission (mission.id)}
      <button
        class="mission-card w-full max-w-sm p-6 rounded-lg border-2 transition-all {getMissionClass(
          mission
        )}"
        class:cursor-pointer={mission.unlocked}
        class:cursor-not-allowed={!mission.unlocked}
        onclick={() => startMission(mission)}
        disabled={!mission.unlocked}
      >
        <div class="mission-header pb-4">
          <div class="mission-number text-sm opacity-70 mb-2">Mission {mission.id}</div>
          <h3 class="mission-title text-2xl font-bold title mb-2">{mission.title}</h3>
          <div
            class="mission-status text-sm font-bold {mission.unlocked
              ? 'text-cyan-400'
              : 'text-gray-500'}"
          >
            {getMissionStatus(mission)}
          </div>
        </div>

        <div class="mission-description text-sm opacity-80 pb-4 min-h-[60px]">
          {mission.description}
        </div>

        <div class="mission-objectives flex-col gap-2">
          <div class="text-xs opacity-70 font-bold">OBJECTIVES:</div>
          {#each mission.objectives as objective, i (i)}
            <div class="objective-item text-xs opacity-70 text-left">
              • {objective.description}
            </div>
          {/each}
        </div>

        {#if mission.hasBoss}
          <div
            class="boss-badge mt-4 p-2 bg-purple-500/20 border border-purple-500 rounded text-xs font-bold text-purple-400"
          >
            ⚔️ BOSS ENCOUNTER
          </div>
        {/if}
      </button>
    {/each}
  </div>
</div>

<style>
  h1 {
    word-spacing: -30px;
    line-height: 120%;
  }

  .mission-card {
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(10px);
  }

  .mission-card.available {
    border-color: rgba(0, 170, 255, 0.5);
    background: rgba(0, 0, 0, 0.7);
  }

  .mission-card.available:hover {
    border-color: rgba(0, 170, 255, 1);
    background: rgba(0, 102, 204, 0.2);
    box-shadow: 0 0 20px rgba(0, 170, 255, 0.5);
    transform: translateY(-4px);
  }

  .mission-card.completed {
    border-color: rgba(0, 255, 0, 0.5);
    background: rgba(0, 50, 0, 0.3);
  }

  .mission-card.completed:hover {
    border-color: rgba(0, 255, 0, 0.8);
    box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
  }

  .mission-card.locked {
    border-color: rgba(128, 128, 128, 0.3);
    background: rgba(0, 0, 0, 0.5);
    opacity: 0.6;
  }

  .mission-title {
    word-spacing: -10px;
    line-height: 110%;
  }

  .objective-item {
    padding-left: 0.5rem;
  }
</style>
