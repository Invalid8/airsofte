<script lang="ts">
  import { fly, scale } from 'svelte/transition'
  import { onMount } from 'svelte'
  import Button from '../components/Button.svelte'
  import { navigateTo, gameState } from '../stores/gameStore'
  import { gameManager } from '../lib/gameManager'
  import { StorageManager } from '../utils/storageManager'
  import { currentUser } from '../utils/userManager'

  let showVictory = $state(false)
  let stats = $derived($gameState.session)
  let bonusScore = $state(0)
  let totalScore = $state(0)
  let isHighScore = $state(false)
  let rank = $state(0)

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

    const mode = gameManager.mode
    const scores = StorageManager.getHighScores()
    const scoreList = mode === 'QUICK_PLAY' ? scores.quickPlay : scores.storyMode

    isHighScore = scoreList.length < 20 || totalScore > scoreList[scoreList.length - 1].score

    if (isHighScore && $currentUser) {
      const position = scoreList.filter((s) => s.score > totalScore).length
      rank = position + 1

      const playerName = $currentUser.username
      gameManager.saveHighScore(playerName, $currentUser.id)
    }
  })

  function handleContinue(): void {
    if (gameManager.mode === 'STORY_MODE') {
      navigateTo('STORY_MODE_MENU')
    } else {
      navigateTo('MAIN_MENU')
    }
  }

  function handleReplay(): void {
    if (gameManager.mode === 'STORY_MODE') {
      navigateTo('STORY_MODE_PLAY')
    } else {
      navigateTo('QUICK_PLAY')
    }
  }
</script>

{#if showVictory}
  <div class="victory-screen flex items-center justify-center p-6">
    <div class="victory-container max-w-3xl w-full" in:scale={{ duration: 600, start: 0.9 }}>
      <div class="victory-header text-center mb-8">
        <h1 class="victory-title text-6xl uppercase glow-text title mb-4">Victory!</h1>
        <p class="victory-subtitle text-xl opacity-80">Mission Accomplished</p>
      </div>

      <div class="stats-panel">
        <div class="main-score-section mb-6">
          <div class="score-label">Total Score</div>
          <div class="score-value glow-text-green">{totalScore.toLocaleString()}</div>
          {#if bonusScore > 0}
            <div class="bonus-breakdown">
              <span class="base-score">{$gameState.score.toLocaleString()}</span>
              <span class="plus">+</span>
              <span class="bonus-score">{bonusScore.toLocaleString()}</span>
              <span class="bonus-label">bonus</span>
            </div>
          {/if}
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Waves <br /> Cleared</div>
            <div class="stat-value hud">{stats?.currentWave || 0}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Enemies <br /> Defeated</div>
            <div class="stat-value hud">{stats?.enemiesDefeated || 0}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Shot <br />Accuracy</div>
            <div class="stat-value hud">{stats?.accuracy.toFixed(1) || 0}%</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Time <br /> Spent</div>
            <div class="stat-value hud">
              {Math.floor((stats?.timeElapsed ?? 0) / 60000)}:{String(
                Math.floor(((stats?.timeElapsed ?? 0) % 60000) / 1000)
              ).padStart(2, '0')}
            </div>
          </div>
        </div>

        {#if isHighScore}
          <div class="high-score-banner" in:fly={{ y: 30, duration: 400, delay: 400 }}>
            <!-- <div class="banner-icon">🏆</div> -->
            <div class="banner-content">
              <div class="banner-title">New High Score!</div>
              <div class="banner-subtitle">Rank #{rank} on the leaderboard</div>
            </div>
          </div>
        {/if}
      </div>

      <div class="actions flex gap-4 justify-center mt-8">
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
  }

  .victory-title {
    word-spacing: -30px;
    line-height: 110%;
    animation: title-glow 2s ease-in-out infinite;
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

  .stats-panel {
    background: rgba(0, 0, 0, 0.7);
    border: 2px solid rgba(0, 255, 170, 0.4);
    border-radius: 1rem;
    padding: 2rem;
  }

  .main-score-section {
    text-align: center;
    padding-bottom: 2rem;
    border-bottom: 1px solid rgba(0, 255, 170, 0.2);
  }

  .score-label {
    font-size: 1.25rem;
    opacity: 0.7;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
  }

  .score-value {
    font-size: 4rem;
    font-weight: bold;
    line-height: 1;
    margin-bottom: 0.75rem;
  }

  .bonus-breakdown {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 1.125rem;
    opacity: 0.8;
  }

  .base-score {
    color: #ffffff;
  }

  .plus {
    color: #00ff88;
  }

  .bonus-score {
    color: #ffaa00;
    font-weight: bold;
  }

  .bonus-label {
    font-size: 0.875rem;
    opacity: 0.7;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
    margin-top: 2rem;
  }

  .stat-card {
    text-align: center;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(0, 255, 170, 0.2);
    border-radius: 0.5rem;
  }

  .stat-label {
    font-size: 0.875rem;
    opacity: 0.7;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
  }

  .stat-value {
    font-size: 1.75rem;
    font-weight: bold;
    color: #00ff88;
  }

  .high-score-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 2rem;
    padding: 1.5rem 2rem;
    background: linear-gradient(135deg, rgba(112, 218, 112, 0.2), rgba(143, 221, 98, 0.2));
    border: 2px solid rgba(154, 221, 160, 0.6);
    border-radius: 1rem;
  }

  .banner-icon {
    font-size: 3rem;
  }

  .banner-content {
    text-align: center;
  }

  .banner-title {
    font-size: 1.75rem;
    font-weight: bold;
    color: #00ff88;
    font-family: 'Press Start 2P', cursive;
    line-height: 1.2;
    margin-bottom: 0.25rem;
  }

  .banner-subtitle {
    font-size: 1.125rem;
    opacity: 0.9;
  }
</style>
