<script lang="ts">
  import { onMount } from 'svelte'
  import { navigateTo, gameState } from '../../stores/gameStore'
  import { storyMissionManager } from '../../lib/storyMissionData'
  import { audioManager } from '../../utils/AudioManager'
  import BackBtn from '../../components/BackBtn.svelte'
  import type { StoryMission } from '../../types/gameTypes'

  let missions = $state<StoryMission[]>([])

  onMount(() => {
    missions = storyMissionManager.getMissions()
  })

  function startMission(mission: StoryMission): void {
    if (!mission.unlocked) return

    audioManager.playSound('menuClick')
    gameState.update((state) => ({
      ...state,
      currentMissionId: mission.id
    }))

    navigateTo('STORY_MODE_PLAY')
  }

  function getMissionStatus(mission: StoryMission): { icon: string; text: string; color: string } {
    if (mission.completed) return { icon: '✓', text: 'COMPLETED', color: 'green' }
    if (mission.unlocked) return { icon: '▶', text: 'AVAILABLE', color: 'cyan' }
    return { icon: '🔒', text: 'LOCKED', color: 'gray' }
  }
</script>

<div class="story-mode-screen">
  <BackBtn />

  <div class="story-header">
    <h1 class="title">Story Mode</h1>
    <p class="subtitle">Complete missions to unlock the next chapter</p>
  </div>

  <div class="missions-container">
    {#each missions as mission (mission.id)}
      {@const status = getMissionStatus(mission)}
      <button
        class="mission-card col-span-1 size-full"
        class:unlocked={mission.unlocked}
        class:completed={mission.completed}
        class:locked={!mission.unlocked}
        onclick={() => startMission(mission)}
        disabled={!mission.unlocked}
      >
        <div class="card-header">
          <div class="mission-number">Mission {mission.id}</div>
          <div
            class="mission-status"
            class:status-green={status.color === 'green'}
            class:status-cyan={status.color === 'cyan'}
            class:status-gray={status.color === 'gray'}
          >
            <span class="status-icon">{status.icon}</span>
            <span class="status-text">{status.text}</span>
          </div>
        </div>

        <div class="card-body flex-1">
          <h3 class="mission-name title">{mission.title}</h3>
          <p class="mission-desc">{mission.description}</p>

          <div class="mission-meta">
            <div class="meta-item">
              <!-- <span class="meta-icon">🌊</span> -->
              <span class="meta-text">{mission.waves.length} Waves</span>
            </div>
            <div class="meta-item">
              <!-- <span class="meta-icon">🎯</span> -->
              <span class="meta-text">{mission.objectives.length} Objectives</span>
            </div>
            {#if mission.hasBoss}
              <div class="meta-item">
                <!-- <span class="meta-icon">⚔️</span> -->
                <span class="meta-text">Boss</span>
              </div>
            {/if}
          </div>
        </div>

        {#if !mission.unlocked}
          <div class="card-overlay">
            <div class="overlay-icon">🔒</div>
            <div class="overlay-text">Complete previous missions</div>
          </div>
        {/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .story-mode-screen {
    min-height: 100vh;
    padding: 6rem 2rem 2rem;
  }

  .story-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .title {
    font-size: 3.5rem;
    text-transform: uppercase;
    word-spacing: -20px;
    line-height: 110%;
    color: #00aaff;
    text-shadow: 0 0 30px rgba(0, 170, 255, 0.6);
    margin-bottom: 1rem;
  }

  .subtitle {
    font-size: 1.125rem;
    opacity: 0.8;
  }

  .missions-container {
    max-width: 80rem;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 2rem;
    padding-bottom: 4rem;
  }

  .mission-card {
    position: relative;
    background: linear-gradient(135deg, rgba(0, 15, 30, 0.8) 0%, rgba(0, 30, 60, 0.8) 100%);
    border: 2px solid rgba(0, 170, 255, 0.3);
    border-radius: 1rem;
    padding: 0;
    overflow: hidden;
    transition: all 0.3s ease;
    cursor: pointer;
    text-align: left;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .mission-card.unlocked {
    border-color: rgba(0, 170, 255, 0.5);
  }

  .mission-card.unlocked:hover {
    transform: translateY(-8px);
    border-color: rgba(0, 170, 255, 1);
    box-shadow: 0 12px 40px rgba(0, 170, 255, 0.4);
    background: linear-gradient(135deg, rgba(0, 30, 60, 0.9) 0%, rgba(0, 60, 120, 0.9) 100%);
  }

  .mission-card.completed {
    border-color: rgba(0, 255, 136, 0.4);
  }

  .mission-card.completed:hover {
    border-color: rgba(0, 255, 136, 0.7);
    box-shadow: 0 12px 40px rgba(0, 255, 136, 0.3);
  }

  .mission-card.locked {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background: rgba(0, 0, 0, 0.3);
    border-bottom: 1px solid rgba(0, 170, 255, 0.2);
  }

  .mission-number {
    font-size: 0.875rem;
    font-weight: bold;
    opacity: 0.8;
    text-transform: uppercase;
  }

  .mission-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: bold;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    text-transform: uppercase;
  }

  .status-cyan {
    background: rgba(0, 170, 255, 0.2);
    color: #00aaff;
  }

  .status-green {
    background: rgba(0, 255, 136, 0.2);
    color: #00ff88;
  }

  .status-gray {
    background: rgba(128, 128, 128, 0.2);
    color: #aaa;
  }

  .card-body {
    padding: 1.5rem;
  }

  .mission-name {
    font-size: 1.5rem;
    margin-bottom: 0.75rem;
    word-spacing: -8px;
    line-height: 120%;
  }

  .mission-desc {
    font-size: 0.9375rem;
    opacity: 0.85;
    line-height: 1.5;
    margin-bottom: 1.5rem;
    min-height: 3rem;
  }

  .mission-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(0, 170, 255, 0.2);
    border-radius: 0.5rem;
    font-size: 0.875rem;
  }

  .meta-item.boss {
    border-color: rgba(255, 100, 100, 0.4);
    background: rgba(255, 0, 0, 0.1);
  }

  .meta-icon {
    font-size: 1rem;
  }

  .card-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }

  .overlay-icon {
    font-size: 3rem;
    opacity: 0.5;
  }

  .overlay-text {
    font-size: 0.875rem;
    opacity: 0.7;
    text-align: center;
  }

  @media (max-width: 768px) {
    .story-mode-screen {
      padding: 5rem 1rem 2rem;
    }

    .title {
      font-size: 2.5rem;
    }

    .missions-container {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }
</style>
