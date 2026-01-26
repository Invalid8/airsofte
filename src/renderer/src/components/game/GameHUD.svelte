<script lang="ts">
  import {
    currentScore,
    playerHealth,
    playerLives,
    currentWave,
    gameState
  } from '../../stores/gameStore'

  let showCombo = $derived(
    $gameState.session?.comboMultiplier && $gameState.session.comboMultiplier > 1
  )
  let comboMultiplier = $derived($gameState.session?.comboMultiplier ?? 1)
  let weaponType = $derived($gameState.player?.weaponType ?? 'SINGLE')
  let maxHealth = $derived($gameState.player?.maxHealth ?? 100)
  let healthPercentage = $derived(($playerHealth / maxHealth) * 100)
  let shieldActive = $derived($gameState.player?.shieldActive ?? false)
  let invincible = $derived($gameState.player?.invincible ?? false)
</script>

<div class="hud fixed top-0 left-0 right-0 pointer-events-none z-50 p-3 sm:p-6">
  <div class="sm:hidden">
    <div
      class="flex items-center justify-between gap-3 bg-black/60 border border-cyan-500/40 rounded-lg px-3 py-2"
    >
      <div class="text-lg font-bold hud">
        {$currentScore.toLocaleString()}
      </div>

      <div class="flex gap-1">
        {#each Array($playerLives) as x, i (i)}
          <svg class="w-4 h-4 fill-red-500" viewBox="0 0 24 24">
            <path
              id={x}
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            />
          </svg>
        {/each}
      </div>

      <div class="w-24 h-3 bg-black/50 border border-cyan-500 rounded overflow-hidden relative">
        <div
          class="h-full transition-all duration-300"
          class:bg-green-500={healthPercentage > 60}
          class:bg-yellow-500={healthPercentage > 30 && healthPercentage <= 60}
          class:bg-red-500={healthPercentage <= 30}
          style="width: {healthPercentage}%"
        >
          {#if shieldActive}
            <div class="absolute inset-0 bg-blue-400/30 animate-pulse"></div>
          {/if}
        </div>
      </div>
    </div>

    <div class="flex justify-between mt-2 px-1">
      <div class="text-sm hud opacity-80">
        W{$currentWave}
      </div>
      {#if showCombo}
        <div class="text-yellow-400 font-bold text-sm hud">
          x{comboMultiplier.toFixed(1)}
        </div>
      {/if}
      <div class="flex items-center gap-5">
        <div class="text-sm hud opacity-80">
          {weaponType}
        </div>
      </div>
    </div>

    {#if invincible}
      <div class="text-center text-sm text-cyan-400 animate-pulse hud mt-1">INVINCIBLE</div>
    {/if}
  </div>

  <div class="hidden sm:flex justify-between items-start gap-4">
    <div class="left-panel">
      <div class="score-display">
        <div class="label text-base tracking-wider opacity-70">SCORE</div>
        <div class="value text-4xl font-bold glow-text hud">
          {$currentScore.toLocaleString()}
        </div>
      </div>

      <div class="h-3"></div>

      <div class="wave-display">
        <div class="label text-base tracking-wider opacity-70">WAVE</div>
        <div class="value text-2xl font-bold hud">{$currentWave}</div>
      </div>

      {#if showCombo}
        <div class="combo-display animate-pulse mt-2">
          <div class="label text-base tracking-wider opacity-70">COMBO</div>
          <div class="value text-3xl font-bold text-yellow-400 hud">
            x{comboMultiplier.toFixed(1)}
          </div>
        </div>
      {/if}
    </div>

    <div class="right-panel text-right">
      <div class="lives-display flex items-center justify-end gap-2">
        <div class="hearts flex gap-1">
          {#each Array($playerLives) as x, i (i)}
            <svg class="w-6 h-6 fill-red-500" viewBox="0 0 24 24">
              <path
                id={x}
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            </svg>
          {/each}
        </div>
      </div>

      <div class="h-3"></div>

      <div class="health-display">
        <div class="label text-base tracking-wider opacity-70 pb-1 block">HEALTH</div>
        <div
          class="health-bar-container w-48 h-6 bg-black/50 border-2 border-cyan-500 rounded overflow-hidden relative"
        >
          <div
            class="health-bar h-full transition-all duration-300"
            class:bg-green-500={healthPercentage > 60}
            class:bg-yellow-500={healthPercentage > 30 && healthPercentage <= 60}
            class:bg-red-500={healthPercentage <= 30}
            style="width: {healthPercentage}%"
          >
            {#if shieldActive}
              <div class="absolute inset-0 bg-blue-400/30 animate-pulse"></div>
            {/if}
          </div>
        </div>
        <div class="health-value text-base tracking-wider pt-1 hud">
          {Math.max(0, $playerHealth)} / {maxHealth}
        </div>
      </div>

      <div class="h-3"></div>

      <div class="weapon-display">
        <div class="label text-base tracking-wider opacity-70">WEAPON</div>
        <div class="value text-xl font-bold hud">{weaponType}</div>
      </div>

      {#if invincible}
        <div
          class="invincible-indicator text-base tracking-wider text-cyan-400 animate-pulse hud mt-2"
        >
          INVINCIBLE
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .hud {
    text-shadow: 0 0 10px rgba(0, 170, 255, 0.8);
  }

  .score-display,
  .wave-display,
  .lives-display,
  .health-display,
  .weapon-display,
  .combo-display {
    background: rgba(0, 0, 0, 0.7);
    border: 2px solid rgba(0, 170, 255, 0.5);
    border-radius: 8px;
    padding: 8px 10px;
    min-width: 100px;
  }

  .health-bar {
    box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.3);
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @media (max-width: 640px) {
    .score-display,
    .wave-display,
    .lives-display,
    .health-display,
    .weapon-display,
    .combo-display {
      background: transparent;
      border: none;
      padding: 0;
      min-width: auto;
    }

    .hud {
      text-shadow: 0 0 6px rgba(0, 170, 255, 0.6);
    }
  }
</style>
