<script lang="ts">
  import { onMount } from 'svelte'
  import Options from '../components/Options.svelte'
  import { gameManager } from '../lib/gameManager'
  import { navigateTo, gameState } from '../stores/gameStore'
  import { StorageManager } from '../utils/storageManager'
  import { currentUser } from '../utils/userManager'
  import { formatNumberWithCommas } from '../lib/utils'
  import MissionReport from '../components/MissionReport.svelte'

  let isHighScore = $state(false)
  let rank = $state(0)
  let stats = $derived($gameState.session)

  let showMissionReport = $state(true)
  let previousReports = $state<string[]>([])

  onMount(() => {
    const finalScore = $gameState.score
    const mode = gameManager.mode

    if ($currentUser) {
      const userId = $currentUser.id
      const scores = StorageManager.getHighScores(userId)
      const scoreList = mode === 'QUICK_PLAY' ? scores.quickPlay : scores.storyMode

      const userScores = scoreList.filter((s) => s.name === $currentUser.username)
      const currentUserHighScore =
        userScores.length > 0 ? Math.max(...userScores.map((s) => s.score)) : 0

      if (finalScore > currentUserHighScore) {
        isHighScore = true
        const position = scoreList.filter((s) => s.score > finalScore).length
        rank = position + 1

        const playerName = $currentUser.username
        gameManager.saveHighScore(playerName, userId)
      }
    }

    const stored = localStorage.getItem('missionReports')
    if (stored) {
      try {
        previousReports = JSON.parse(stored)
      } catch (e) {
        previousReports = []
      }
    }
  })

  function handleReportClose() {
    showMissionReport = false
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

  function handleMainMenu(): void {
    gameManager.isPlaying = false
    if (gameManager.mode === 'STORY_MODE') {
      navigateTo('STORY_MODE_MENU')
    } else {
      navigateTo('MAIN_MENU')
    }
  }

  const gameOverOptions = [
    {
      label: 'Play Again',
      value: 'restart',
      isFirst: true,
      onClick: handleRestart
    },
    {
      label: 'Main Menu',
      value: 'main_menu',
      onClick: handleMainMenu
    }
  ]

  function handleSelect(value: string): void {
    console.log(`Game over option selected: ${value}`)
  }

  function formatTime(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  const missionName = $derived('Mission ' + ($gameState.currentMissionId || 1))
  const isVictory = $derived((stats?.currentWave ?? 0) >= 10)
  const damageTaken = $derived(100 - (gameManager.player?.health || 0))
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
            {formatNumberWithCommas($gameState.score)}
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

    <Options options={gameOverOptions} layout="horizontal" gap="md" select={handleSelect} />
  </div>
</div>

{#if showMissionReport}
  <MissionReport
    {missionName}
    outcome={isVictory ? 'victory' : 'defeat'}
    score={$gameState.score}
    enemiesDefeated={stats?.enemiesDefeated ?? 0}
    {damageTaken}
    {previousReports}
    onClose={handleReportClose}
  />
{/if}

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
</style>
