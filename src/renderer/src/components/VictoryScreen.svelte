<script lang="ts">
  import { fly, scale } from 'svelte/transition'
  import { onMount } from 'svelte'
  import Button from '../components/Button.svelte'
  import { navigateTo, gameState } from '../stores/gameStore'
  import { gameManager } from '../lib/gameManager'

  let showVictory = $state(false)
  let stats = $derived($gameState.session)
  let bonusScore = $state(0)
  let totalScore = $state(0)

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
  })

  function handleContinue(): void {
    if (gameManager.mode === 'STORY_MODE') {
      navigateTo('STORY_MODE_MENU')
    } else {
      navigateTo('MAIN_MENU')
    }
  }

  function handleReplay(): void {
    navigateTo('GAME_SCREEN')
  }
</script>

{#if showVictory}
  <div
    class="victory-screen fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-8 pt-10"
  >
    <div class="victory-container max-w-3xl w-full" in:scale={{ duration: 800, start: 0.8 }}>
      <div
        class="victory-header text-center grid mb-10"
        in:fly={{ y: -50, duration: 600, delay: 200 }}
      >
        <h1 class="victory-title text-6xl uppercase glow-text title grid mb-4">Victory!</h1>
        <p class="victory-subtitle text-2xl opacity-80">Mission Accomplished</p>
      </div>

      <div
        class="stats-grid grid grid-cols-2 gap-6 grid mb-8"
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

      {#if bonusScore > 0}
        <div
          class="bonus-section p-6 bg-yellow-500/20 border-2 border-yellow-500 rounded-lg mb-4"
          in:fly={{ y: 30, duration: 600, delay: 600 }}
        >
          <div class="text-2xl font-bold text-yellow-400 grid mb-3 text-center">
            ⭐ Bonus Points ⭐
          </div>
          <div class="text-6xl text-center hud">{bonusScore.toLocaleString()} pts</div>
        </div>
      {/if}

      <div
        class="total-score-section p-8 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500 rounded-lg mb-5"
        in:fly={{ y: 30, duration: 600, delay: 800 }}
      >
        <div class="text-3xl font-bold text-center grid mb-2">TOTAL SCORE</div>
        <div class="text-6xl font-bold text-center glow-text hud">
          {totalScore.toLocaleString()}
        </div>
      </div>

      <div class="actions flex gap-4 justify-center" in:fly={{ y: 30, duration: 600, delay: 1000 }}>
        <Button label="Continue" onClick={handleContinue} isFirst={true} />
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

  .victory-badge {
    filter: drop-shadow(0 0 30px rgba(255, 215, 0, 0.8));
  }

  .stat-card {
    background: rgba(0, 0, 0, 0.6);
    border: 2px solid rgba(0, 170, 255, 0.4);
    border-radius: 0.75rem;
    padding: 1.5rem;
    text-align: center;
    transition: all 0.3s;
  }

  .stat-card:hover {
    border-color: rgba(0, 170, 255, 0.8);
    box-shadow: 0 0 20px rgba(0, 170, 255, 0.3);
    transform: translateY(-4px);
  }

  .stat-label {
    font-size: 0.875rem;
    opacity: 0.7;
    margin-bottom: 0.5rem;
    font-family: 'Orbitron', sans-serif;
  }

  .stat-value {
    font-size: 3rem;
    font-weight: bold;
    font-family: 'VT323', monospace;
    color: #00aaff;
  }

  .bonus-section {
    animation: bonus-flash 1s ease-in-out;
  }

  @keyframes bonus-flash {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
</style>
