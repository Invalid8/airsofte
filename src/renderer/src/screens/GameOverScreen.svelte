<script lang="ts">
  import { fly } from 'svelte/transition'
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

    if (isHighScore) {
      const playerName = $currentUser?.username || 'Guest'
      gameManager.saveHighScore(playerName)
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
  class="flex flex-col gap-6 text-center p-6 items-center h-screen justify-center"
  in:fly={{ y: 200, duration: 500 }}
>
  <div class="flex flex-col items-center justify-center gap-6 max-w-2xl w-full">
    <h1 class="title text-5xl uppercase glow-text">Game Over</h1>

    <div class="stats-panel bg-black/70 border-2 border-cyan-500 rounded-xl p-8 w-full">
      <div class="grid grid-cols-2 gap-6">
        <div class="stat-item">
          <div class="label text-sm opacity-70">FINAL SCORE</div>
          <div class="value text-4xl font-bold glow-text hud">
            {$gameState.score.toLocaleString()}
          </div>
        </div>

        <div class="stat-item">
          <div class="label text-sm opacity-70">WAVE REACHED</div>
          <div class="value text-4xl font-bold hud">{stats?.currentWave ?? 0}</div>
        </div>

        <div class="stat-item">
          <div class="label text-sm opacity-70">ENEMIES DEFEATED</div>
          <div class="value text-2xl font-bold hud">{stats?.enemiesDefeated ?? 0}</div>
        </div>

        <div class="stat-item">
          <div class="label text-sm opacity-70">ACCURACY</div>
          <div class="value text-2xl font-bold hud">{stats?.accuracy.toFixed(1) ?? 0}%</div>
        </div>

        <div class="stat-item col-span-2">
          <div class="label text-sm opacity-70">TIME SURVIVED</div>
          <div class="value text-2xl font-bold hud">
            {Math.floor((stats?.timeElapsed ?? 0) / 60000)}:{String(
              Math.floor(((stats?.timeElapsed ?? 0) % 60000) / 1000)
            ).padStart(2, '0')}
          </div>
        </div>
      </div>

      {#if isHighScore}
        <div
          class="high-score-badge mt-6 p-4 bg-yellow-500/20 border-2 border-yellow-500 rounded-lg animate-pulse"
        >
          <div class="text-2xl font-bold text-yellow-400 title">🏆 NEW HIGH SCORE! 🏆</div>
        </div>
      {/if}
    </div>

    <div class="options flex gap-4 flex-wrap justify-center">
      <Button label="Play Again" onClick={handleRestart} isFirst={true} />
      <Button label="Main Menu" onClick={handleMainMenu} />
    </div>
  </div>
</div>

<style>
  h1 {
    word-spacing: -30px;
    line-height: 120%;
  }

  .stat-item {
    text-align: center;
  }

  .label {
    font-family: 'Orbitron', sans-serif;
  }
</style>
