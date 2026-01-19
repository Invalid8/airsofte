<script lang="ts">
  import { fly } from 'svelte/transition'
  import { onMount } from 'svelte'
  import Button from '../components/Button.svelte'
  import { gameManager } from '../lib/gameManager'
  import { navigateTo, gameState } from '../stores/gameStore'
  import { StorageManager } from '../utils/storageManager'

  let playerName = $state('Player')
  let showNameInput = $state(false)
  let isHighScore = $state(false)
  let stats = $derived($gameState.session)

  onMount(() => {
    const finalScore = $gameState.score
    const mode = gameManager.mode

    isHighScore = StorageManager.isHighScore(finalScore, mode)
    showNameInput = isHighScore
  })

  function saveScore(): void {
    if (playerName.trim()) {
      gameManager.saveHighScore(playerName.trim())
      showNameInput = false
    }
  }

  function handleRestart(): void {
    navigateTo('GAME_SCREEN')
  }

  function handleMainMenu(): void {
    navigateTo('MAIN_MENU')
  }
</script>

<div
  class="flex flex-col gap-6 text-center p-6 items-center h-svh justify-center"
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

    {#if showNameInput}
      <div class="name-input-panel bg-black/70 border-2 border-cyan-500 rounded-xl p-6 w-full">
        <label class="block grid mb-4">
          <span class="text-lg grid mb-2 block">Enter Your Name:</span>
          <input
            type="text"
            bind:value={playerName}
            maxlength="20"
            class="w-full px-4 py-3 bg-black/50 border-2 border-cyan-500 rounded text-white text-center text-xl hud focus:outline-none focus:border-cyan-300"
            placeholder="Player"
            onkeydown={(e) => e.key === 'Enter' && saveScore()}
          />
        </label>
        <Button label="Save Score" onClick={saveScore} />
      </div>
    {/if}

    <div class="options flex gap-4 flex-wrap justify-center">
      <Button label="Play Again" onClick={handleRestart} isFirst={!showNameInput} />
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

  .value {
    font-family: 'VT323', monospace;
  }
</style>
