<script lang="ts">
  import { fly } from 'svelte/transition'
  import Button from '../../components/Button.svelte'
  import { toggleHelp } from '../../stores/gameStore'

  let activeSection: 'controls' | 'mechanics' | 'enemies' | 'powerups' = $state('controls')
</script>

<div class="overlay fixed size-full top-0 left-0 right-0 bottom-0 bg-black/70 z-[999]"></div>

<div
  class="help-modal fixed w-full max-w-3xl rounded-xl bg-white/10 space-1-bg p-6 pt-8 z-[999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-auto scroll"
  in:fly={{ y: 200, duration: 500 }}
>
  <div class="content flex flex-col gap-6">
    <h2 class="title text-3xl uppercase glow-text-2 text-center">Help & Guide</h2>

    <div class="tabs grid grid-cols-4 gap-2">
      <button
        class="tab-btn"
        class:active={activeSection === 'controls'}
        onclick={() => (activeSection = 'controls')}
      >
        Controls
      </button>
      <button
        class="tab-btn"
        class:active={activeSection === 'mechanics'}
        onclick={() => (activeSection = 'mechanics')}
      >
        Mechanics
      </button>
      <button
        class="tab-btn"
        class:active={activeSection === 'enemies'}
        onclick={() => (activeSection = 'enemies')}
      >
        Enemies
      </button>
      <button
        class="tab-btn"
        class:active={activeSection === 'powerups'}
        onclick={() => (activeSection = 'powerups')}
      >
        Power-Ups
      </button>
    </div>

    <div class="help-content bg-black/30 border border-cyan-500/30 rounded-xl p-6 min-h-[400px]">
      {#if activeSection === 'controls'}
        <div class="flex-col gap-6">
          <h3 class="text-2xl font-bold mb-4 text-cyan-400">Game Controls</h3>

          <div class="controls-grid grid grid-cols-2 gap-4">
            <div class="control-item">
              <strong>W / ↑</strong>
              <span>Move Up</span>
            </div>
            <div class="control-item">
              <strong>S / ↓</strong>
              <span>Move Down</span>
            </div>
            <div class="control-item">
              <strong>A / ←</strong>
              <span>Move Left</span>
            </div>
            <div class="control-item">
              <strong>D / →</strong>
              <span>Move Right</span>
            </div>
            <div class="control-item">
              <strong>Space</strong>
              <span>Shoot</span>
            </div>
            <div class="control-item">
              <strong>Esc</strong>
              <span>Pause Game</span>
            </div>
          </div>

          <div class="tip-box">
            <strong>💡 Pro Tip:</strong> Keep moving! Standing still makes you an easy target.
          </div>
        </div>
      {/if}

      {#if activeSection === 'mechanics'}
        <div class="flex-col gap-6">
          <h3 class="text-2xl font-bold mb-4 text-cyan-400">Game Mechanics</h3>

          <div class="mechanic-item">
            <h4 class="text-xl font-bold text-cyan-300 mb-2">⚡ Combo System</h4>
            <p>
              Destroy enemies consecutively without getting hit to build your combo multiplier.
              Higher combos mean more points!
            </p>
            <ul class="mt-2 ml-4 list-disc">
              <li>Combo resets after 3 seconds of inactivity</li>
              <li>Max multiplier: 5x</li>
              <li>Taking damage resets your combo</li>
            </ul>
          </div>

          <div class="mechanic-item">
            <h4 class="text-xl font-bold text-cyan-300 mb-2">❤️ Health System</h4>
            <p>
              You have 100 HP and 3 lives. When your health reaches 0, you lose a life and respawn
              with full health and temporary invincibility.
            </p>
          </div>

          <div class="mechanic-item">
            <h4 class="text-xl font-bold text-cyan-300 mb-2">🌊 Wave Progression</h4>
            <p>
              Defeat all enemies in a wave to advance. Each wave gets progressively harder with more
              enemies and tougher patterns.
            </p>
          </div>

          <div class="mechanic-item">
            <h4 class="text-xl font-bold text-cyan-300 mb-2">🎯 Accuracy</h4>
            <p>
              Your accuracy is tracked based on bullets fired vs enemies destroyed. Higher accuracy
              shows your skill!
            </p>
          </div>
        </div>
      {/if}

      {#if activeSection === 'enemies'}
        <div class="flex-col gap-6">
          <h3 class="text-2xl font-bold mb-4 text-cyan-400">Enemy Types</h3>

          <div class="enemy-item">
            <h4 class="text-xl font-bold text-red-400 mb-2">👾 Basic Fighter</h4>
            <div class="stats">
              <span>Health: 30</span>
              <span>Speed: Medium</span>
              <span>Points: 100</span>
            </div>
            <p class="mt-2">
              Standard enemy that moves straight down. Easy to hit but comes in numbers.
            </p>
          </div>

          <div class="enemy-item">
            <h4 class="text-xl font-bold text-yellow-400 mb-2">⚡ Scout</h4>
            <div class="stats">
              <span>Health: 15</span>
              <span>Speed: Fast</span>
              <span>Points: 150</span>
            </div>
            <p class="mt-2">
              Fast and agile. Uses zigzag patterns to dodge your shots. Worth more points!
            </p>
          </div>

          <div class="enemy-item">
            <h4 class="text-xl font-bold text-orange-400 mb-2">💣 Bomber</h4>
            <div class="stats">
              <span>Health: 80</span>
              <span>Speed: Slow</span>
              <span>Points: 300</span>
            </div>
            <p class="mt-2">
              Heavy and durable. Slow but takes many hits to destroy. High point reward.
            </p>
          </div>

          <div class="enemy-item">
            <h4 class="text-xl font-bold text-purple-400 mb-2">👑 Boss</h4>
            <div class="stats">
              <span>Health: 1000</span>
              <span>Speed: Variable</span>
              <span>Points: 5000</span>
            </div>
            <p class="mt-2">
              Appears every 5 waves. Requires strategy and skill to defeat. Massive point reward!
            </p>
          </div>
        </div>
      {/if}

      {#if activeSection === 'powerups'}
        <div class="flex-col gap-6">
          <h3 class="text-2xl font-bold mb-4 text-cyan-400">Power-Ups</h3>

          <div class="powerup-item">
            <h4 class="text-xl font-bold text-green-400 mb-2">❤️ Health</h4>
            <p>Restores 30 HP. Cannot exceed maximum health.</p>
          </div>

          <div class="powerup-item">
            <h4 class="text-xl font-bold text-red-400 mb-2">🔫 Weapon Upgrade</h4>
            <p>
              Temporarily upgrades your weapon to DOUBLE, TRIPLE, or SPREAD shot. Lasts 15 seconds.
            </p>
          </div>

          <div class="powerup-item">
            <h4 class="text-xl font-bold text-blue-400 mb-2">🛡️ Shield</h4>
            <p>Grants a protective shield that blocks one hit. Lasts 10 seconds or until hit.</p>
          </div>

          <div class="powerup-item">
            <h4 class="text-xl font-bold text-yellow-400 mb-2">⚡ Speed Boost</h4>
            <p>Increases movement speed by 50%. Lasts 8 seconds. Great for dodging!</p>
          </div>

          <div class="powerup-item">
            <h4 class="text-xl font-bold text-purple-400 mb-2">⭐ Score Bonus</h4>
            <p>Instantly grants 500 bonus points. Collect these to boost your high score!</p>
          </div>

          <div class="tip-box mt-4">
            <strong>💡 Pro Tip:</strong> Power-ups spawn more frequently on Easy difficulty. Plan your
            difficulty choice accordingly!
          </div>
        </div>
      {/if}
    </div>

    <div class="text-center">
      <Button label="Close" onClick={toggleHelp} />
    </div>
  </div>
</div>

<style>
  h2 {
    word-spacing: -10px;
    line-height: 115%;
  }

  .tab-btn {
    padding: 0.75rem 1rem;
    background: rgba(0, 0, 0, 0.5);
    border: 2px solid rgba(0, 170, 255, 0.3);
    border-radius: 0.5rem;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Orbitron', sans-serif;
    font-size: 0.9rem;
  }

  .tab-btn:hover {
    background: rgba(0, 170, 255, 0.2);
  }

  .tab-btn.active {
    background: rgba(0, 102, 204, 0.5);
    border-color: #00aaff;
    box-shadow: 0 0 10px rgba(0, 170, 255, 0.5);
  }

  .control-item {
    display: flex;
    justify-content: space-between;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(0, 170, 255, 0.2);
    border-radius: 0.5rem;
  }

  .control-item strong {
    color: #00aaff;
    font-family: 'VT323', monospace;
    font-size: 1.2rem;
  }

  .mechanic-item,
  .enemy-item,
  .powerup-item {
    padding: 1.5rem;
    background: rgba(0, 0, 0, 0.3);
    border-left: 4px solid #00aaff;
    border-radius: 0.5rem;
  }

  .stats {
    display: flex;
    gap: 1rem;
    font-size: 0.9rem;
    color: #00aaff;
    font-family: 'VT323', monospace;
  }

  .tip-box {
    padding: 1rem;
    background: rgba(0, 170, 255, 0.1);
    border: 2px solid rgba(0, 170, 255, 0.3);
    border-radius: 0.5rem;
    color: #00aaff;
  }
</style>
