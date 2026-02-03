<script lang="ts">
  import { onMount } from 'svelte'
  import { navigateTo, gameState } from '../../stores/gameStore'
  import { storyMissionManager } from '../../lib/storyMissionData'
  import { progressionSystem } from '../../lib/progressionSystem'
  import { audioManager } from '../../utils/AudioManager'
  import BackBtn from '../../components/BackBtn.svelte'
  import type { StoryMission } from '../../types/gameTypes'

  let missions = $state<StoryMission[]>([])
  let missionRatings = $state<Map<number, { stars: number; bestScore: number }>>(new Map())
  let completedCount = $state(0)
  let totalStars = $state(0)

  onMount(() => {
    missions = storyMissionManager.getMissions()
    loadMissionRatings()
  })

  function loadMissionRatings(): void {
    const progression = progressionSystem.getProgression()
    const ratingsMap = new Map<number, { stars: number; bestScore: number }>()

    let completed = 0
    let stars = 0

    progression.missionRatings.forEach((rating) => {
      ratingsMap.set(rating.missionId, {
        stars: rating.stars,
        bestScore: rating.bestScore
      })

      completed++
      stars += rating.stars
    })

    missionRatings = ratingsMap
    completedCount = completed
    totalStars = stars
  }

  function getMissionStars(missionId: number): number {
    return missionRatings.get(missionId)?.stars ?? 0
  }

  function getBestScore(missionId: number): number {
    return missionRatings.get(missionId)?.bestScore ?? 0
  }

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
  <BackBtn
    onClick={() => {
      navigateTo('GAME_SCREEN')
    }}
  />

  <div class="scroll-container">
    <div class="story-header">
      <h1 class="title">Story Mode</h1>
      <p class="subtitle">Complete missions to unlock the next chapter</p>

      {#if completedCount > 0}
        <div class="progress-summary">
          <div class="summary-item">
            <span class="summary-label">Missions Completed</span>
            <span class="summary-value hud">{completedCount}/{missions.length}</span>
          </div>
          <div class="summary-divider">•</div>
          <div class="summary-item">
            <span class="summary-label">Total Stars</span>
            <span class="summary-value stars hud">
              {totalStars}/{missions.length * 3} ⭐
            </span>
          </div>
        </div>
      {/if}
    </div>

    <div class="missions-container">
      {#each missions as mission (mission.id)}
        {@const status = getMissionStatus(mission)}
        {@const stars = getMissionStars(mission.id)}
        {@const bestScore = getBestScore(mission.id)}
        <button
          class="mission-card"
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

          <div class="card-body">
            <h3 class="mission-name title">{mission.title}</h3>
            <p class="mission-desc">{mission.description}</p>

            <div class="mission-meta">
              <div class="meta-item">
                <span class="meta-text">{mission?.waves?.length} Waves</span>
              </div>
              <div class="meta-item">
                <span class="meta-text">{mission.objectives.length} Objectives</span>
              </div>
              {#if mission.hasBoss}
                <div class="meta-item boss">
                  <span class="meta-text">Boss</span>
                </div>
              {/if}
            </div>

            {#if stars > 0}
              <div class="stars-display">
                {#each Array(3) as _, i (i)}
                  <span class="star" class:filled={i < stars}>⭐</span>
                {/each}
              </div>

              {#if bestScore > 0}
                <div class="best-score">
                  <span class="best-score-label">Best:</span>
                  <span class="best-score-value hud">{bestScore.toLocaleString()}</span>
                </div>
              {/if}
            {/if}
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
</div>

<style>
  .story-mode-screen {
    width: 100%;
    height: 100vh;
    position: relative;
    overflow: hidden;
  }

  .scroll-container {
    width: 100%;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 6rem 2rem 4rem;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 170, 255, 0.5) rgba(0, 0, 0, 0.3);
  }

  .scroll-container::-webkit-scrollbar {
    width: 8px;
  }

  .scroll-container::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
  }

  .scroll-container::-webkit-scrollbar-thumb {
    background: rgba(0, 170, 255, 0.5);
    border-radius: 4px;
  }

  .scroll-container::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 170, 255, 0.7);
  }

  .story-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .title {
    font-size: clamp(2rem, 5vw, 3.5rem);
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
    margin-bottom: 2rem;
  }

  .progress-summary {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1.5rem;
    padding: 1.5rem 2rem;
    background: linear-gradient(135deg, rgba(0, 170, 255, 0.1), rgba(0, 255, 136, 0.1));
    border: 2px solid rgba(0, 170, 255, 0.3);
    border-radius: 1rem;
    max-width: 40rem;
    margin: 0 auto;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .summary-label {
    font-size: 0.875rem;
    opacity: 0.7;
    text-transform: uppercase;
  }

  .summary-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #00aaff;
  }

  .summary-value.stars {
    color: #ffd700;
  }

  .summary-divider {
    font-size: 1.5rem;
    opacity: 0.3;
  }

  .missions-container {
    max-width: 80rem;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(360px, 100%), 1fr));
    gap: 2rem;
    padding-bottom: 2rem;
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
    min-height: 280px;
    display: flex;
    flex-direction: column;
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
    flex-shrink: 0;
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
    flex: 1;
    display: flex;
    flex-direction: column;
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
    margin-bottom: 1rem;
    flex: 1;
  }

  .mission-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 1rem;
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
    color: #ff6666;
  }

  .stars-display {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    font-size: 1.5rem;
  }

  .star {
    opacity: 0.3;
    filter: grayscale(100%);
    animation: star-shine 2s ease-in-out infinite;
  }

  .star.filled {
    opacity: 1;
    filter: grayscale(0%);
    text-shadow: 0 0 10px #ffd700;
  }

  @keyframes star-shine {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }

  .best-score {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 140, 0, 0.1));
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-radius: 0.5rem;
    font-size: 0.875rem;
  }

  .best-score-label {
    opacity: 0.8;
  }

  .best-score-value {
    font-weight: bold;
    color: #ffd700;
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
    .scroll-container {
      padding: 5rem 1rem 3rem;
    }

    .title {
      font-size: 2rem;
    }

    .progress-summary {
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
    }

    .summary-divider {
      display: none;
    }

    .missions-container {
      gap: 1.5rem;
    }
  }
</style>
