<script lang="ts">
  import { fly, scale } from 'svelte/transition'
  import { onMount } from 'svelte'
  import Button from '../components/Button.svelte'
  import { navigateTo, gameState } from '../stores/gameStore'
  import { gameManager } from '../utils/gameManager'
  import { StorageManager } from '../utils/storageManager'
  import { currentUser } from '../utils/userManager'

  let showVictory = $state(false)
  let stats = $derived($gameState.session)
  let bonusScore = $state(0)
  let totalScore = $state(0)
  let isHighScore = $state(false)
  let showNameInput = $state(false)
  let playerName = $state('')
  let rank = $state(0)
  let animationsDone = $state(false)
  let container: HTMLDivElement = $state()

  onMount(() => {
    setTimeout(() => {
      showVictory = true
    }, 500)

    const baseScore = $gameState.score
    const noDamageBonus = gameManager.player.health === gameManager.player.maxHealth ? 1000 : 0
    const accuracyBonus = Math.floor((stats?.accuracy || 0) * 10)

    bonusScore = noDamageBonus + accuracyBonus
    totalScore = baseScore + bonusScore

    gameManager.session.score = totalScore

    const mode = gameManager.mode
    const scores = StorageManager.getHighScores($currentUser?.id)
    const scoreList = mode === 'QUICK_PLAY' ? scores.quickPlay : scores.storyMode

    isHighScore = scoreList.length < 20 || totalScore > scoreList[scoreList.length - 1].score

    if (isHighScore) {
      const position = scoreList.filter((s) => s.score > totalScore).length
      rank = position + 1
      showNameInput = true
    }

    setTimeout(() => {
      container?.scrollTo({ top: 0 })
      animationsDone = true
    }, 1600)
  })

  function handleSaveScore(): void {
    if (playerName.trim()) {
      gameManager.saveHighScore(playerName.trim(), $currentUser?.id)
      showNameInput = false
    }
  }

  /**
   * ✅ FIX: Navigate based on current game mode
   * - Quick Play → back to MAIN_MENU
   * - Story Mode → back to STORY_MODE_MENU
   */
  function handleContinue(): void {
    if (gameManager.mode === 'STORY_MODE') {
      navigateTo('STORY_MODE_MENU')
    } else {
      navigateTo('MAIN_MENU')
    }
  }

  /**
   * ✅ FIX: Replay based on current game mode
   * - Quick Play → restart QUICK_PLAY
   * - Story Mode → restart same mission in STORY_MODE_PLAY
   */
  function handleReplay(): void {
    if (gameManager.mode === 'STORY_MODE') {
      // Restart the same story mission
      navigateTo('STORY_MODE_PLAY')
    } else {
      // Restart quick play with same difficulty
      navigateTo('QUICK_PLAY')
    }
  }
</script>

{#if showVictory}
  <div
    class="victory-screen fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4 sm:p-6 md:p-8"
  >
    <div
      bind:this={container}
      class="victory-container max-w-3xl w-full max-h-[90vh] custom-scrollbar px-5 scroll"
      class:overflow-hidden={!animationsDone}
      class:overflow-y-auto={animationsDone}
      in:scale={{ duration: 800, start: 0.8 }}
    >
      <!-- Victory Header -->
      <div
        class="victory-header text-center mb-6 sm:mb-8 md:mb-10"
        in:fly={{ y: -50, duration: 600, delay: 200 }}
      >
        <h1 class="victory-title text-4xl sm:text-5xl md:text-6xl uppercase glow-text title mb-4">
          Victory!
        </h1>
        <p class="victory-subtitle text-xl sm:text-2xl opacity-80">Mission Accomplished</p>
      </div>

      <!-- Stats Grid -->
      <div
        class="stats-grid grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8"
        in:fly={{ y: 50, duration: 600, delay: 400 }}
      >
        <div class="stat-card">
          <div class="stat-label text-nowrap">Base Score</div>
          <div class="stat-value">{$gameState.score.toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label text-nowrap">Waves Cleared</div>
          <div class="stat-value">{stats?.currentWave || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label text-nowrap">Enemies Defeated</div>
          <div class="stat-value">{stats?.enemiesDefeated || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label text-nowrap">Accuracy</div>
          <div class="stat-value">{stats?.accuracy.toFixed(1) || 0}%</div>
        </div>
      </div>

      <!-- Bonus Section -->
      <div
        class="bonus-section p-4 sm:p-6 bg-yellow-500/20 border-2 border-yellow-500 rounded-lg mb-4 transition-all overflow-hidden"
        class:opacity-0={bonusScore <= 0}
        class:pointer-events-none={bonusScore <= 0}
        class:max-h-0={bonusScore <= 0}
        class:max-h-[200px]={bonusScore > 0}
        in:fly={{ y: 30, duration: 600, delay: 600 }}
      >
        <div class="text-xl sm:text-2xl font-bold text-yellow-400 mb-3 text-center">
          ⭐ Bonus Points ⭐
        </div>
        <div class="text-4xl sm:text-5xl md:text-6xl text-center">
          {bonusScore.toLocaleString()} pts
        </div>
      </div>

      <!-- Total Score -->
      <div
        class="total-score-section p-6 sm:p-8 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500 rounded-lg mb-4 sm:mb-5"
        in:fly={{ y: 30, duration: 600, delay: 800 }}
      >
        <div class="text-2xl sm:text-3xl font-bold text-center mb-2">TOTAL SCORE</div>
        <div class="text-5xl sm:text-6xl font-bold text-center glow-text">
          {totalScore.toLocaleString()}
        </div>
      </div>

      <!-- High Score Banner -->
      <div
        class="high-score-banner p-4 sm:p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500 rounded-lg mb-4 transition-all overflow-hidden"
        class:opacity-0={!isHighScore}
        class:pointer-events-none={!isHighScore}
        class:max-h-0={!isHighScore}
        class:max-h-[200px]={isHighScore}
        in:fly={{ y: 30, duration: 600, delay: 1000 }}
      >
        <div class="text-2xl sm:text-3xl font-bold text-center mb-2 text-purple-400 animate-pulse">
          🏆 NEW HIGH SCORE! 🏆
        </div>
        <div class="text-lg sm:text-xl text-center opacity-80">
          Rank #{rank} on the leaderboard!
        </div>
      </div>

      <!-- Name Input (if high score) -->
      <div
        class="name-input-panel p-4 sm:p-6 bg-black/70 border-2 border-cyan-500 rounded-xl mb-4 transition-all overflow-hidden"
        class:opacity-0={!showNameInput}
        class:pointer-events-none={!showNameInput}
        class:max-h-0={!showNameInput}
        class:max-h-[300px]={showNameInput}
        in:fly={{ y: 30, duration: 600, delay: 1200 }}
      >
        <label class="block mb-4">
          <span class="text-base sm:text-lg mb-2 block text-center">
            Enter Your Name for the Leaderboard:
          </span>
          <input
            type="text"
            bind:value={playerName}
            maxlength="20"
            class="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/50 border-2 border-cyan-500 rounded text-white text-center text-lg sm:text-xl focus:outline-none focus:border-cyan-300"
            placeholder="Your Name"
            onkeydown={(e) => e.key === 'Enter' && handleSaveScore()}
          />
        </label>
        <div class="text-center">
          <Button label="Save Score" onClick={handleSaveScore} isFirst={true} />
        </div>
      </div>

      <!-- Action Buttons -->
      <div
        class="actions flex gap-3 sm:gap-4 flex-wrap justify-center"
        in:fly={{ y: 30, duration: 600, delay: 1400 }}
      >
        <Button label="Continue" onClick={handleContinue} isFirst={!showNameInput} />
        <Button label="Play Again" onClick={handleReplay} />
      </div>
    </div>
  </div>
{/if}

<style>
  .victory-screen {
    background: radial-gradient(
      circle at center,
      rgba(0, 170, 255, 0.1) 0%,
      rgba(0, 0, 0, 0.95) 100%
    );
    animation: victory-glow 3s ease-in-out infinite;
  }

  @keyframes victory-glow {
    0%,
    100% {
      background: radial-gradient(
        circle at center,
        rgba(0, 170, 255, 0.1) 0%,
        rgba(0, 0, 0, 0.95) 100%
      );
    }
    50% {
      background: radial-gradient(
        circle at center,
        rgba(0, 170, 255, 0.2) 0%,
        rgba(0, 0, 0, 0.95) 100%
      );
    }
  }

  .victory-title {
    word-spacing: -30px;
    line-height: 110%;
    animation: title-pulse 2s ease-in-out infinite;
  }

  @keyframes title-pulse {
    0%,
    100% {
      text-shadow:
        0 0 20px #00aaff,
        0 0 40px #00aaff;
    }
    50% {
      text-shadow:
        0 0 30px #00aaff,
        0 0 60px #00aaff;
    }
  }

  .stat-card {
    background: rgba(0, 0, 0, 0.6);
    border: 2px solid rgba(0, 170, 255, 0.4);
    border-radius: 0.75rem;
    padding: 1rem;
    text-align: center;
    transition: all 0.3s;
  }

  .stat-card:hover {
    border-color: rgba(0, 170, 255, 0.8);
    box-shadow: 0 0 20px rgba(0, 170, 255, 0.3);
    transform: translateY(-4px);
  }

  .stat-label {
    font-size: 0.75rem;
    opacity: 0.7;
    margin-bottom: 0.5rem;
    font-family: 'Orbitron', sans-serif;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: #00aaff;
  }

  .glow-text {
    text-shadow: 0 0 20px rgba(0, 170, 255, 0.8);
  }
</style>
