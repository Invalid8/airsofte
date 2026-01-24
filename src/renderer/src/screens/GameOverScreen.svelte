<script lang="ts">
  import { onMount } from 'svelte'
  import Button from '../components/Button.svelte'
  import { gameManager } from '../lib/gameManager'
  import { navigateTo, gameState } from '../stores/gameStore'
  import { StorageManager } from '../utils/storageManager'
  import { currentUser } from '../utils/userManager'

  let isHighScore = $state(false)
  let stats = $derived($gameState.session)

  onMount(() => {
    const finalScore = $gameState.score
    const mode = gameManager.mode

    isHighScore = StorageManager.isHighScore(finalScore, mode)

    if (isHighScore && $currentUser) {
      const playerName = $currentUser.username
      gameManager.saveHighScore(playerName, $currentUser.id)
    }
  })

  function handleRestart(): void {
    if (gameManager.mode === 'STORY_MODE') {
      navigateTo('STORY_MODE_PLAY')
    } else {
      navigateTo('QUICK_PLAY')
    }
  }

  function handleMainMenu(): void {
    if (gameManager.mode === 'STORY_MODE') {
      navigateTo('STORY_MODE_MENU')
    } else {
      navigateTo('MAIN_MENU')
    }
  }
</script>

<div
  class="gameover-screen flex flex-col gap-6 text-center p-6 items-center h-screen w-screen justify-center"
>
  <div class="gameover-container flex flex-col items-center justify-center gap-6 max-w-2xl w-full">
    <h1 class="title text-5xl uppercase glow-text">Game Over</h1>

    <div class="stats-panel">
      <div class="stats-grid">
        <div class="stat-item main-stat">
          <div class="stat-label">Final Score</div>
          <div class="stat-value large glow-text-red hud">
            {$gameState.score.toLocaleString()}
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
            {Math.floor((stats?.timeElapsed ?? 0) / 60000)}:{String(
              Math.floor(((stats?.timeElapsed ?? 0) % 60000) / 1000)
            ).padStart(2, '0')}
          </div>
        </div>
      </div>

      <!-- {#if isHighScore}
        <div class="high-score-badge">
          <div class="badge-icon">🏆</div>
          <div class="badge-text">New High Score!</div>
        </div>
      {/if} -->
    </div>

    <div class="actions flex gap-4 flex-wrap justify-center">
      <Button label="Play Again" onClick={handleRestart} isFirst={true} />
      <Button label="Main Menu" onClick={handleMainMenu} />
    </div>
  </div>
</div>

<style>
  .gameover-screen {
    background: radial-gradient(
      circle at center,
      rgba(255, 0, 0, 0.05) 0%,
      rgba(0, 0, 0, 0.95) 100%
    );
  }

  h1 {
    word-spacing: -30px;
    line-height: 120%;
    animation: title-pulse 2s ease-in-out infinite;
  }

  @keyframes title-pulse {
    0%,
    100% {
      text-shadow:
        0 0 20px #ff0000,
        0 0 40px #ff0000;
    }
    50% {
      text-shadow:
        0 0 30px #ff0000,
        0 0 60px #ff0000;
    }
  }

  .stats-panel {
    width: 100%;
    background: rgba(0, 0, 0, 0.7);
    border: 2px solid rgba(255, 0, 0, 0.3);
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
    border: 1px solid rgba(255, 0, 0, 0.2);
    border-radius: 0.5rem;
  }

  .stat-item.main-stat {
    grid-column: 1 / -1;
    padding: 1.5rem;
    border-width: 2px;
    border-color: rgba(255, 0, 0, 0.4);
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
    color: #ff6666;
  }

  .stat-value.large {
    font-size: 3rem;
  }

  .high-score-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 1rem 2rem;
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 140, 0, 0.2));
    border: 2px solid rgba(255, 215, 0, 0.6);
    border-radius: 9999px;
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

  .badge-icon {
    font-size: 2rem;
  }

  .badge-text {
    font-size: 1.5rem;
    font-weight: bold;
    color: #ffd700;
    font-family: 'Press Start 2P', cursive;
  }
</style>
