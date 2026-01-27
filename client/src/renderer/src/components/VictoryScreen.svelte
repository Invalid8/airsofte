<script lang="ts">
  import { fly, scale, fade } from 'svelte/transition'
  import { onMount } from 'svelte'
  import Button from '../components/Button.svelte'
  import { navigateTo, gameState } from '../stores/gameStore'
  import { gameManager } from '../lib/gameManager'
  import { storyMissionManager } from '../lib/storyMissionData'
  import { StorageManager } from '../utils/storageManager'
  import { currentUser } from '../utils/userManager'

  let showVictory = $state(false)
  let stats = $derived($gameState.session)
  let bonusScore = $state(0)
  let totalScore = $state(0)
  let isHighScore = $state(false)
  let rank = $state(0)
  let missionStars = $state(0)
  let showStars = $state(false)

  onMount(() => {
    setTimeout(() => {
      showVictory = true
    }, 300)

    const baseScore = $gameState.score
    const noDamageBonus = gameManager.player.health === gameManager.player.maxHealth ? 1000 : 0
    const accuracyBonus = Math.floor((stats?.accuracy || 0) * 10)

    bonusScore = noDamageBonus + accuracyBonus
    totalScore = baseScore + bonusScore

    gameManager.session.score = totalScore

    if (gameManager.mode === 'STORY_MODE') {
      const missionId = $gameState.currentMissionId || 1
      const mission = storyMissionManager.getMissionById(missionId)

      if (mission) {
        missionStars = storyMissionManager.calculateStars(mission, {
          score: totalScore,
          timeElapsed: stats?.timeElapsed || 0,
          damageTaken: gameManager.player.maxHealth - gameManager.player.health,
          accuracy: stats?.accuracy || 0
        })

        storyMissionManager.completeMission(missionId, missionStars)

        setTimeout(() => {
          showStars = true
        }, 800)
      }
    }

    if ($currentUser) {
      const mode = gameManager.mode
      const userId = $currentUser.id
      const scores = StorageManager.getHighScores(userId)
      const scoreList = mode === 'QUICK_PLAY' ? scores.quickPlay : scores.storyMode

      if (scoreList.length < 20 || totalScore > scoreList[scoreList.length - 1].score) {
        isHighScore = true
        const position = scoreList.filter((s) => s.score > totalScore).length
        rank = position + 1

        const playerName = $currentUser.username
        gameManager.saveHighScore(playerName, userId)
      }
    }
  })

  function handleContinue(): void {
    gameManager.isPlaying = false
    if (gameManager.mode === 'STORY_MODE') {
      navigateTo('STORY_MODE_MENU')
    } else {
      navigateTo('MAIN_MENU')
    }
  }

  function handleReplay(): void {
    gameManager.isPlaying = false

    gameState.update((state) => ({
      ...state,
      session: null,
      player: null,
      score: 0
    }))

    setTimeout(() => {
      if (gameManager.mode === 'STORY_MODE') {
        const missionId = $gameState.currentMissionId || 1
        gameManager.startGame('STORY_MODE', gameManager.difficulty, missionId)
        navigateTo('STORY_MODE_PLAY')
      } else {
        gameManager.startGame('QUICK_PLAY', gameManager.difficulty)
        navigateTo('QUICK_PLAY')
      }
    }, 100)
  }
</script>

{#if showVictory}
  <div class="victory-screen">
    <div class="victory-container" in:scale={{ duration: 600, start: 0.9 }}>
      <div class="victory-header" in:fly={{ y: -30, delay: 200 }}>
        <h1 class="victory-title title">Victory!</h1>
        <p class="victory-subtitle">Mission Accomplished</p>
      </div>

      {#if gameManager.mode === 'STORY_MODE' && showStars}
        <div class="stars-display" in:fly={{ y: -30, duration: 500, delay: 600 }}>
          <div class="stars-container">
            {#each Array(3) as x, i (i)}
              <div class="star-wrapper" id={x} in:scale={{ delay: 700 + i * 150, duration: 400 }}>
                <svg
                  class="star"
                  class:filled={i < missionStars}
                  width="80"
                  height="80"
                  viewBox="0 0 24 24"
                  fill={i < missionStars ? '#FFD700' : 'none'}
                  stroke={i < missionStars ? '#FFA500' : '#666'}
                  stroke-width="1.5"
                >
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  />
                </svg>
              </div>
            {/each}
          </div>
          <div class="stars-text hud">
            {missionStars === 3
              ? 'Perfect!'
              : missionStars === 2
                ? 'Great!'
                : missionStars === 1
                  ? 'Good!'
                  : 'Try Again'}
          </div>
        </div>
      {/if}

      <div class="score-hero" in:fly={{ y: 30, delay: 400 }}>
        <div class="score-label">Total Score</div>
        <div class="score-value glow-text-green hud">{totalScore.toLocaleString()}</div>
        {#if bonusScore > 0}
          <div class="bonus-breakdown">
            <span class="base-score">{$gameState.score.toLocaleString()}</span>
            <span class="plus">+</span>
            <span class="bonus-score">{bonusScore.toLocaleString()}</span>
            <span class="bonus-label">bonus</span>
          </div>
        {/if}
      </div>

      <div class="stats-list" in:fly={{ y: 30, delay: 500 }}>
        <div class="stat-card">
          <svg
            class="stat-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <div class="stat-content">
            <span class="stat-label">Waves Cleared</span>
            <span class="stat-value hud">{stats?.currentWave || 0}</span>
          </div>
        </div>

        <div class="stat-card">
          <svg
            class="stat-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <div class="stat-content">
            <span class="stat-label">Enemies Defeated</span>
            <span class="stat-value hud">{stats?.enemiesDefeated || 0}</span>
          </div>
        </div>

        <div class="stat-card">
          <svg
            class="stat-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M16 8l-8 8M8 8l8 8" />
          </svg>
          <div class="stat-content">
            <span class="stat-label">Shot Accuracy</span>
            <span class="stat-value hud">{stats?.accuracy.toFixed(1) || 0}%</span>
          </div>
        </div>

        <div class="stat-card">
          <svg
            class="stat-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <div class="stat-content">
            <span class="stat-label">Time Spent</span>
            <span class="stat-value hud">
              {Math.floor((stats?.timeElapsed ?? 0) / 60000)}:{String(
                Math.floor(((stats?.timeElapsed ?? 0) % 60000) / 1000)
              ).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {#if isHighScore}
        <div class="high-score-banner" in:fly={{ y: 30, duration: 400, delay: 700 }}>
          <svg
            class="banner-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          </svg>
          <div class="banner-content">
            <div class="banner-title">New High Score!</div>
            <div class="banner-subtitle">Rank #{rank} on the leaderboard</div>
          </div>
        </div>
      {/if}

      <div class="actions" in:fade={{ delay: 800 }}>
        <Button label="Continue" onClick={handleContinue} isFirst={true} />
        <Button label="Play Again" onClick={handleReplay} />
      </div>
    </div>
  </div>
{/if}

<style>
  .victory-screen {
    position: fixed;
    inset: 0;
    z-index: 110;
    background: radial-gradient(
      circle at center,
      rgba(0, 255, 170, 0.08) 0%,
      rgba(0, 0, 0, 0.95) 100%
    );
    padding: 2rem;
    overflow-y: auto;
  }

  .victory-container {
    max-width: 42rem;
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    align-items: center;
  }

  .victory-header {
    text-align: center;
  }

  .victory-title {
    font-size: 3.5rem;
    word-spacing: -30px;
    line-height: 110%;
    animation: title-glow 2s ease-in-out infinite;
    margin-bottom: 0.5rem;
  }

  @keyframes title-glow {
    0%,
    100% {
      text-shadow:
        0 0 20px #00ff88,
        0 0 40px #00ff88;
    }
    50% {
      text-shadow:
        0 0 30px #00ff88,
        0 0 60px #00ff88;
    }
  }

  .victory-subtitle {
    font-size: 1.25rem;
    opacity: 0.9;
  }

  .stars-display {
    padding: 2rem;
    width: 100%;
    max-width: 32rem;
  }

  .stars-container {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-bottom: 1rem;
  }

  .star {
    transition: all 0.3s ease;
    filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
  }

  .star.filled {
    animation: star-glow 1.5s ease-in-out infinite;
  }

  @keyframes star-glow {
    0%,
    100% {
      filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
    }
    50% {
      filter: drop-shadow(0 0 16px rgba(255, 215, 0, 1));
    }
  }

  .stars-text {
    text-align: center;
    font-size: 1.5rem;
    font-weight: bold;
  }

  .score-hero {
    text-align: center;
    padding: 2rem;
    background: rgba(0, 0, 0, 0.6);
    border: 2px solid rgba(0, 255, 170, 0.4);
    border-radius: 1rem;
    width: 100%;
    max-width: 32rem;
  }

  .score-label {
    font-size: 1.125rem;
    opacity: 0.8;
    margin-bottom: 0.75rem;
    text-transform: uppercase;
  }

  .score-value {
    font-size: 3.5rem;
    font-weight: bold;
    line-height: 1;
    margin-bottom: 1rem;
  }

  .bonus-breakdown {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    font-size: 1.125rem;
    opacity: 0.9;
  }

  .base-score {
    color: #ffffff;
  }

  .plus {
    color: #00ff88;
    font-weight: bold;
  }

  .bonus-score {
    color: #ffaa00;
    font-weight: bold;
  }

  .bonus-label {
    font-size: 0.875rem;
    opacity: 0.7;
  }

  .stats-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    max-width: 32rem;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1.25rem;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(0, 255, 170, 0.2);
    border-radius: 0.75rem;
    transition: all 0.3s ease;
  }

  .stat-card:hover {
    background: rgba(0, 255, 170, 0.05);
    border-color: rgba(0, 255, 170, 0.4);
    transform: translateX(8px);
  }

  .stat-icon {
    width: 2.5rem;
    height: 2.5rem;
    color: #00ff88;
    flex-shrink: 0;
  }

  .stat-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex: 1;
  }

  .stat-label {
    font-size: 1rem;
    opacity: 0.8;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #00ff88;
  }

  .high-score-banner {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1.5rem 2rem;
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 140, 0, 0.2));
    border: 2px solid rgba(255, 215, 0, 0.6);
    border-radius: 1rem;
    animation: badge-pulse 1.5s ease-in-out infinite;
    max-width: 32rem;
    width: 100%;
  }

  @keyframes badge-pulse {
    0%,
    100% {
      transform: scale(1);
      box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
    }
  }

  .banner-icon {
    width: 3rem;
    height: 3rem;
    color: #ffd700;
    flex-shrink: 0;
  }

  .banner-content {
    flex: 1;
  }

  .banner-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #ffd700;
    font-family: 'Press Start 2P', cursive;
    line-height: 1.4;
    margin-bottom: 0.25rem;
  }

  .banner-subtitle {
    font-size: 1rem;
    opacity: 0.9;
  }

  .actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  @media (max-width: 768px) {
    .victory-title {
      font-size: 2.5rem;
    }

    .score-value {
      font-size: 2.5rem;
    }

    .stats-list {
      gap: 0.75rem;
    }

    .stat-card {
      padding: 1rem;
    }

    .stat-icon {
      width: 2rem;
      height: 2rem;
    }

    .stat-value {
      font-size: 1.25rem;
    }

    .banner-title {
      font-size: 1.125rem;
    }
  }
</style>
