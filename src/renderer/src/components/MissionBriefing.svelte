<script lang="ts">
  import { fly } from 'svelte/transition'
  import Button from '../components/Button.svelte'
  import type { StoryMission } from '../types/gameTypes'

  let {
    mission,
    onStart,
    onCancel
  }: {
    mission: StoryMission
    onStart: () => void
    onCancel: () => void
  } = $props()
</script>

<div class="briefing-screen fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-8">
  <div
    class="briefing-container max-w-3xl w-full bg-black/80 border-2 border-cyan-500 rounded-xl p-8"
    in:fly={{ y: -50, duration: 500 }}
  >
    <div class="header text-center mb-8">
      <div class="mission-number text-sm opacity-70 mb-2">MISSION {mission.id}</div>
      <h1 class="mission-title text-5xl uppercase glow-text title mb-4">{mission.title}</h1>
      <p class="mission-description text-lg opacity-80">{mission.description}</p>
    </div>

    <div class="objectives-section bg-black/50 border border-cyan-500/30 rounded-lg p-6 mb-6">
      <h2 class="text-2xl font-bold mb-4 text-cyan-400">Mission Objectives</h2>
      <div class="objectives-list flex flex-col gap-3">
        {#each mission.objectives as objective, i (i)}
          <div class="objective-item flex items-start gap-3">
            <div
              class="objective-number size-8 rounded-full bg-cyan-500/20 border border-cyan-500 flex items-center justify-center font-bold text-sm"
            >
              {i + 1}
            </div>
            <div class="objective-details flex-1">
              <div class="objective-desc text-lg">{objective.description}</div>
              <div class="objective-target text-sm opacity-70 mt-1">
                Target: {objective.target}
                {objective.type === 'SURVIVE' ? 'seconds' : ''}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <div class="intel-section bg-black/50 border border-cyan-500/30 rounded-lg p-6 mb-6">
      <h2 class="text-2xl font-bold mb-4 text-cyan-400">Intel Report</h2>
      <div class="intel-grid grid grid-cols-2 gap-4">
        <div class="intel-item">
          <div class="label text-sm opacity-70">Waves</div>
          <div class="value text-xl font-bold hud">{mission.waves.length}</div>
        </div>
        <div class="intel-item">
          <div class="label text-sm opacity-70">Enemy Types</div>
          <div class="value text-xl font-bold hud">
            {new Set(mission.waves.flatMap((w) => w.enemies.map((e) => e.type))).size}
          </div>
        </div>
        <div class="intel-item">
          <div class="label text-sm opacity-70">Difficulty</div>
          <div class="value text-xl font-bold hud">
            {mission.hasBoss ? 'EXTREME' : mission.waves.length > 3 ? 'HIGH' : 'MEDIUM'}
          </div>
        </div>
        <div class="intel-item">
          <div class="label text-sm opacity-70">Boss Encounter</div>
          <div class="value text-xl font-bold hud">
            {mission.hasBoss ? '⚔️ YES' : 'NO'}
          </div>
        </div>
      </div>

      {#if mission.hasBoss}
        <div class="boss-warning mt-4 p-4 bg-red-500/20 border-2 border-red-500 rounded-lg">
          <div class="text-lg font-bold text-red-400 mb-2">⚠️ WARNING: BOSS ENCOUNTER</div>
          <div class="text-sm opacity-80">
            This mission contains a boss-class enemy. Extreme caution advised. Ensure you are
            adequately prepared before engaging.
          </div>
        </div>
      {/if}
    </div>

    <div class="actions flex gap-4 justify-center">
      <Button label="Launch Mission" onClick={onStart} isFirst={true} />
      <Button label="Cancel" onClick={onCancel} />
    </div>
  </div>
</div>

<style>
  .mission-title {
    word-spacing: -20px;
    line-height: 110%;
  }

  .briefing-container {
    box-shadow: 0 0 40px rgba(0, 170, 255, 0.3);
    animation: border-pulse 3s ease-in-out infinite;
  }

  @keyframes border-pulse {
    0%,
    100% {
      border-color: rgba(0, 170, 255, 0.8);
    }
    50% {
      border-color: rgba(0, 170, 255, 1);
    }
  }

  .objective-item {
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.3);
    border-left: 3px solid rgba(0, 170, 255, 0.5);
    border-radius: 0.25rem;
  }

  .intel-item {
    text-align: center;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 0.5rem;
    border: 1px solid rgba(0, 170, 255, 0.2);
  }
</style>
