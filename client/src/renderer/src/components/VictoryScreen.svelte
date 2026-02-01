<script lang="ts">
  import { onMount } from 'svelte'
  import Options from '../components/Options.svelte'
  import { gameManager } from '../lib/gameManager'
  import { navigateTo, gameState } from '../stores/gameStore'
  import { StorageManager } from '../utils/storageManager'
  import { currentUser } from '../utils/userManager'
  import { formatNumberWithCommas } from '../lib/utils'

  let isHighScore = $state(false)
  let rank = $state(0)
  let stats = $derived($gameState.session)
  let missionStars = $state(0)
  let totalScore = $state(0)

  const starMessages = {
    0: {
      title: 'Mission Failed',
      message: 'Better luck next time, pilot.',
      color: '#ff6666'
    },
    1: {
      title: 'Mission Complete',
      message: 'You got the job done.',
      color: '#ffaa00'
    },
    2: {
      title: 'Great Performance',
      message: 'Impressive flying, pilot!',
      color: '#00aaff'
    },
    3: {
      title: 'Perfect Mission',
      message: 'Exceptional! You are a true ace!',
      color: '#00ff88'
    }
  }

  let currentMessage = $derived(starMessages[missionStars as keyof typeof starMessages])

  onMount(() => {
    totalScore = $gameState.score
    const mode = gameManager.mode

    if (mode === 'STORY_MODE' && stats) {
      calculateMissionStars()
    }

    if ($currentUser) {
      const userId = $currentUser.id
      const scores = StorageManager.getHighScores(userId)
      const scoreList = mode === 'QUICK_PLAY' ? scores.quickPlay : scores.storyMode

      if (scoreList.length < 20) {
        isHighScore = true
        const position = scoreList.filter((s) => s.score > totalScore).length
        rank = position + 1
        gameManager.saveHighScore($currentUser.username, userId)
      } else {
        const lowestScore = scoreList[scoreList.length - 1].score
        if (totalScore > lowestScore) {
          isHighScore = true
          const position = scoreList.filter((s) => s.score > totalScore).length
          rank = position + 1
          gameManager.saveHighScore($currentUser.username, userId)
        }
      }
    }
  })

  function calculateMissionStars(): void {
    if (!stats) {
      missionStars = 0
      return
    }

    const baseScore = 5000
    const twoStarThreshold = baseScore * 1.5
    const threeStarRequirement = baseScore * 2

    if (totalScore >= threeStarRequirement && (stats.accuracy >= 70 || stats.damageTaken === 0)) {
      missionStars = 3
    } else if (totalScore >= twoStarThreshold) {
      missionStars = 2
    } else if (totalScore >= baseScore) {
      missionStars = 1
    } else {
      missionStars = 0
    }
  }

  function handleContinue() {
    gameManager.isPlaying = false

    if (gameManager.mode === 'STORY_MODE') {
      navigateTo('STORY_MODE_MENU')
    } else if (gameManager.mode === 'AI_MISSION') {
      navigateTo('AI_MISSIONS')
    } else {
      navigateTo('MAIN_MENU')
    }
  }

  function handleRestart(): void {
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
      } else {
        navigateTo('QUICK_PLAY')
      }
    }, 100)
  }

  const victoryOptions = [
    {
      label: gameManager.mode === 'STORY_MODE' && missionStars > 0 ? 'Continue' : 'Retry Mission',
      value: gameManager.mode === 'STORY_MODE' && missionStars > 0 ? 'continue' : 'retry',
      isFirst: true,
      onClick:
        gameManager.mode === 'STORY_MODE' && missionStars > 0 ? handleContinue : handleRestart
    },
    {
      label: 'Main Menu',
      value: 'menu',
      onClick: handleContinue
    }
  ]

  function handleSelect(value: string): void {
    console.log(`Victory option selected: ${value}`)
  }

  function formatTime(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }
</script>

<div class="victory-screen">
  <div class="victory-container">
    {#if gameManager.mode === 'STORY_MODE'}
      <div class="mission-result" style="border-color: {currentMessage.color}">
        <h2 class="result-title" style="color: {currentMessage.color}">
          {currentMessage.title}
        </h2>
        <p class="result-message">{currentMessage.message}</p>

        <div class="stars-display-large">
          {#each Array(3) as _, i (i)}
            <div
              class="star-large"
              class:filled={i < missionStars}
              style="animation-delay: {i * 0.2}s"
            >
              ⭐
            </div>
          {/each}
        </div>

        <div class="stats-compact">
          <span>Score: {formatNumberWithCommas(totalScore)}</span>
          <span>•</span>
          <span>Time: {formatTime(stats?.timeElapsed ?? 0)}</span>
          <span>•</span>
          <span>Accuracy: {stats?.accuracy.toFixed(0) ?? 0}%</span>
        </div>

        {#if isHighScore}
          <div class="high-score-badge">
            <div class="badge-text">New High Score!</div>
            <div class="badge-subtitle">Rank #{rank}</div>
          </div>
        {/if}
      </div>
    {:else}
      <h1 class="title">Victory!</h1>

      <div class="stats-panel">
        <div class="stats-grid">
          <div class="stat-item main-stat">
            <div class="stat-label">Final Score</div>
            <div class="stat-value large glow-text hud">
              {formatNumberWithCommas(totalScore)}
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-label">Wave <br /> Reached</div>
            <div class="stat-value hud">{stats?.currentWave ?? 0}</div>
          </div>

          <div class="stat-item">
            <div class="stat-label">Enemies <br /> Defeated</div>
            <div class="stat-value hud">{stats?.enemiesDefeated ?? 0}</div>
          </div>

          <div class="stat-item">
            <div class="stat-label">Shot <br /> Accuracy</div>
            <div class="stat-value hud">{stats?.accuracy.toFixed(1) ?? 0}%</div>
          </div>

          <div class="stat-item">
            <div class="stat-label">Time <br /> Survived</div>
            <div class="stat-value hud">
              {formatTime(stats?.timeElapsed ?? 0)}
            </div>
          </div>
        </div>

        {#if isHighScore}
          <div class="high-score-badge">
            <div class="badge-text">New High Score!</div>
            <div class="badge-subtitle">Rank #{rank} on the leaderboard</div>
          </div>
        {/if}
      </div>
    {/if}

    <Options options={victoryOptions} layout="horizontal" gap="md" select={handleSelect} />
  </div>
</div>

<style>
  .victory-screen {
    min-height: 100vh;
    width: 100vw;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: radial-gradient(
      circle at center,
      rgba(0, 255, 136, 0.05) 0%,
      rgba(0, 0, 0, 0.95) 100%
    );
  }

  .victory-container {
    max-width: 50rem;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    align-items: center;
  }

  .title {
    font-size: 3.5rem;
    text-transform: uppercase;
    word-spacing: -20px;
    line-height: 120%;
    color: #00ff88;
    text-shadow: 0 0 30px rgba(0, 255, 136, 0.6);
    animation: title-pulse 2s ease-in-out infinite;
  }

  @keyframes title-pulse {
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

  .mission-result {
    width: 100%;
    background: rgba(0, 0, 0, 0.8);
    border: 3px solid;
    border-radius: 1rem;
    padding: 2.5rem;
    text-align: center;
  }

  .result-title {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
    text-shadow: 0 0 20px currentColor;
  }

  .result-message {
    font-size: 1.125rem;
    opacity: 0.9;
    margin-bottom: 2rem;
  }

  .stars-display-large {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin: 2rem 0;
  }

  .star-large {
    font-size: 4rem;
    opacity: 0.3;
    filter: grayscale(100%);
    animation: star-appear 0.5s ease-out forwards;
  }

  .star-large.filled {
    opacity: 1;
    filter: grayscale(0%);
    text-shadow: 0 0 20px #ffd700;
  }

  @keyframes star-appear {
    from {
      transform: scale(0) rotate(-180deg);
      opacity: 0;
    }
    to {
      transform: scale(1) rotate(0deg);
    }
  }

  .stats-compact {
    display: flex;
    gap: 1rem;
    justify-content: center;
    font-size: 1rem;
    opacity: 0.8;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
  }

  .stats-panel {
    width: 100%;
    background: rgba(0, 0, 0, 0.7);
    border: 2px solid rgba(0, 255, 136, 0.3);
    border-radius: 1rem;
    padding: 2rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .stat-item {
    text-align: center;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(0, 255, 136, 0.2);
    border-radius: 0.5rem;
  }

  .stat-item.main-stat {
    grid-column: 1 / -1;
    padding: 1.5rem;
    border-width: 2px;
    border-color: rgba(0, 255, 136, 0.4);
  }

  .stat-label {
    font-size: 0.875rem;
    opacity: 0.7;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    font-family: 'Orbitron', sans-serif;
  }

  .stat-value {
    font-size: 1.75rem;
    font-weight: bold;
    color: #00ff88;
  }

  .stat-value.large {
    font-size: 3rem;
  }

  .high-score-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1.5rem 2rem;
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 140, 0, 0.2));
    border: 2px solid rgba(255, 215, 0, 0.6);
    border-radius: 1rem;
    animation: badge-pulse 1.5s ease-in-out infinite;
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

  .badge-text {
    font-size: 1.5rem;
    font-weight: bold;
    color: #ffd700;
    font-family: 'Press Start 2P', cursive;
  }

  .badge-subtitle {
    font-size: 1.125rem;
    opacity: 0.9;
  }

  @media (max-width: 768px) {
    .victory-screen {
      padding: 1rem;
    }

    .title {
      font-size: 2rem;
    }

    .result-title {
      font-size: 1.75rem;
    }

    .stars-display-large {
      gap: 1rem;
    }

    .star-large {
      font-size: 3rem;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .mission-result {
      padding: 1.5rem;
    }
  }
</style>
