<script lang="ts">
  import Button from '../../components/Button.svelte'
  import { modalManager } from '../../utils/ModalManager'

  let activeSection: 'controls' | 'mechanics' | 'enemies' | 'powerups' = $state('controls')
</script>

<div
  class="help-modal w-full max-w-3xl rounded-xl modal-bg p-6 pt-8 max-h-[90vh] overflow-auto scroll"
>
  <div class="content flex flex-col gap-6">
    <h2 class="title text-3xl uppercase glow-text-2 text-center">Help & Guide</h2>

    <div class="tabs grid grid-cols-4 gap-2">
      <button
        class="tab-btn"
        class:active={activeSection === 'controls'}
        onclick={() => (activeSection = 'controls')}
      >
        <svg
          class="tab-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M6 9h.01M10 9h.01M14 9h.01M6 13h12" />
        </svg>
        <span>Controls</span>
      </button>
      <button
        class="tab-btn"
        class:active={activeSection === 'mechanics'}
        onclick={() => (activeSection = 'mechanics')}
      >
        <svg
          class="tab-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="3" />
          <path
            d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2"
          />
        </svg>
        <span>Mechanics</span>
      </button>
      <button
        class="tab-btn"
        class:active={activeSection === 'enemies'}
        onclick={() => (activeSection = 'enemies')}
      >
        <svg
          class="tab-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span>Enemies</span>
      </button>
      <button
        class="tab-btn"
        class:active={activeSection === 'powerups'}
        onclick={() => (activeSection = 'powerups')}
      >
        <svg
          class="tab-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        </svg>
        <span>Power-Ups</span>
      </button>
    </div>

    <div class="help-content bg-black/30 border border-cyan-500/30 rounded-xl p-6 min-h-[400px]">
      {#if activeSection === 'controls'}
        <div class="flex flex-col gap-6">
          <div class="section-header">
            <svg
              class="section-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M6 9h.01M10 9h.01M14 9h.01M6 13h12" />
            </svg>
            <h3 class="section-title">Game Controls</h3>
          </div>

          <div class="controls-grid grid grid-cols-2 gap-4">
            <div class="control-item">
              <div class="control-keys">
                <kbd class="key">W</kbd>
                <span class="or">/</span>
                <svg class="arrow-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-8 8h6v8h4v-8h6z" />
                </svg>
              </div>
              <span class="control-label">Move Up</span>
            </div>
            <div class="control-item">
              <div class="control-keys">
                <kbd class="key">S</kbd>
                <span class="or">/</span>
                <svg class="arrow-icon rotate-180" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-8 8h6v8h4v-8h6z" />
                </svg>
              </div>
              <span class="control-label">Move Down</span>
            </div>
            <div class="control-item">
              <div class="control-keys">
                <kbd class="key">A</kbd>
                <span class="or">/</span>
                <svg class="arrow-icon -rotate-90" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-8 8h6v8h4v-8h6z" />
                </svg>
              </div>
              <span class="control-label">Move Left</span>
            </div>
            <div class="control-item">
              <div class="control-keys">
                <kbd class="key">D</kbd>
                <span class="or">/</span>
                <svg class="arrow-icon rotate-90" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-8 8h6v8h4v-8h6z" />
                </svg>
              </div>
              <span class="control-label">Move Right</span>
            </div>
            <div class="control-item">
              <div class="control-keys">
                <kbd class="key wide">Space</kbd>
              </div>
              <span class="control-label">Shoot</span>
            </div>
            <div class="control-item">
              <div class="control-keys">
                <kbd class="key wide">Esc</kbd>
              </div>
              <span class="control-label">Pause Game</span>
            </div>
          </div>

          <div class="tip-box">
            <svg
              class="tip-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <div>
              <strong>Pro Tip:</strong> Keep moving! Standing still makes you an easy target. Use diagonal
              movement for maximum mobility.
            </div>
          </div>

          <div class="gamepad-section">
            <div class="section-header">
              <svg
                class="section-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M6 11h4m-2-2v4m8-1h.01M18 10h.01" />
                <path d="M17 2H7a5 5 0 00-5 5v10a5 5 0 005 5h10a5 5 0 005-5V7a5 5 0 00-5-5z" />
              </svg>
              <h4 class="subsection-title">Gamepad Support</h4>
            </div>
            <div class="gamepad-info">
              <div class="gamepad-item">
                <strong>Left Stick / D-Pad:</strong> Movement
              </div>
              <div class="gamepad-item">
                <strong>A Button (Xbox) / X (PlayStation):</strong> Shoot
              </div>
              <div class="gamepad-item">
                <strong>Start Button:</strong> Pause
              </div>
            </div>
          </div>
        </div>
      {/if}

      {#if activeSection === 'mechanics'}
        <div class="flex flex-col gap-6">
          <div class="section-header">
            <svg
              class="section-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path
                d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2"
              />
            </svg>
            <h3 class="section-title">Game Mechanics</h3>
          </div>

          <div class="mechanic-item">
            <div class="mechanic-header">
              <svg
                class="mechanic-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFD700"
                stroke-width="2"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <h4 class="mechanic-title">Combo System</h4>
            </div>
            <p class="mechanic-desc">
              Destroy enemies consecutively without getting hit to build your combo multiplier.
              Higher combos mean more points!
            </p>
            <ul class="mechanic-list">
              <li>Combo resets after 3 seconds of inactivity</li>
              <li>Maximum multiplier: 5x your base score</li>
              <li>Taking damage instantly resets your combo</li>
              <li>Each enemy destroyed increases the multiplier</li>
            </ul>
          </div>

          <div class="mechanic-item">
            <div class="mechanic-header">
              <svg
                class="mechanic-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FF6666"
                stroke-width="2"
              >
                <path
                  d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                />
              </svg>
              <h4 class="mechanic-title">Health & Lives System</h4>
            </div>
            <p class="mechanic-desc">
              You have 100 HP and 3 lives. When your health reaches 0, you lose a life and respawn
              with full health and temporary invincibility.
            </p>
            <ul class="mechanic-list">
              <li>Invincibility lasts 2 seconds after respawning</li>
              <li>Collect health power-ups to restore 30 HP</li>
              <li>Shield power-ups block one hit</li>
              <li>Game over when all lives are lost</li>
            </ul>
          </div>

          <div class="mechanic-item">
            <div class="mechanic-header">
              <svg
                class="mechanic-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#00AAFF"
                stroke-width="2"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
              <h4 class="mechanic-title">Scoring</h4>
            </div>
            <p class="mechanic-desc">
              Your score is affected by difficulty, combo multiplier, and accuracy. Different
              enemies give different points.
            </p>
            <ul class="mechanic-list">
              <li>Basic Fighter: 100 points</li>
              <li>Scout: 150 points</li>
              <li>Bomber: 300 points</li>
              <li>Boss: 5,000 points</li>
              <li>Multiplied by combo and difficulty bonuses</li>
            </ul>
          </div>

          <div class="mechanic-item">
            <div class="mechanic-header">
              <svg
                class="mechanic-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFD700"
                stroke-width="2"
              >
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              </svg>
              <h4 class="mechanic-title">Star Rating (Story Mode)</h4>
            </div>
            <p class="mechanic-desc">
              Story missions are rated 1-3 stars based on your performance. Higher stars show
              mastery!
            </p>
            <ul class="mechanic-list">
              <li>1 Star: Complete all objectives</li>
              <li>2 Stars: Score 1.5x the base requirement</li>
              <li>3 Stars: Score 2x base + 70% accuracy OR take no damage</li>
              <li>Replay missions to improve your rating</li>
            </ul>
          </div>
        </div>
      {/if}

      {#if activeSection === 'enemies'}
        <div class="flex flex-col gap-6">
          <div class="section-header">
            <svg
              class="section-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <h3 class="section-title">Enemy Types</h3>
          </div>

          <div class="enemy-item">
            <div class="enemy-header">
              <svg class="enemy-icon basic" viewBox="0 0 24 24" fill="#FF6600">
                <path d="M12 2l2 7h7l-5.5 4 2 7-6.5-4.5-6.5 4.5 2-7-5.5-4h7z" />
              </svg>
              <h4 class="enemy-title">Basic Fighter</h4>
            </div>
            <div class="enemy-stats">
              <div class="stat-badge hp">30 HP</div>
              <div class="stat-badge speed">Medium Speed</div>
              <div class="stat-badge points">100 Points</div>
            </div>
            <p class="enemy-desc">
              Standard enemy unit. Moves in straight lines or simple patterns. Easy to hit but
              dangerous in groups. Watch for their red bullet fire!
            </p>
          </div>

          <div class="enemy-item">
            <div class="enemy-header">
              <svg class="enemy-icon scout" viewBox="0 0 24 24" fill="#FFAA00">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <h4 class="enemy-title">Scout</h4>
            </div>
            <div class="enemy-stats">
              <div class="stat-badge hp">15 HP</div>
              <div class="stat-badge speed">Fast Speed</div>
              <div class="stat-badge points">150 Points</div>
            </div>
            <p class="enemy-desc">
              Fast and agile scout unit. Uses zigzag and wave patterns to evade your shots. Low
              health but high value. Can teleport in advanced missions!
            </p>
          </div>

          <div class="enemy-item">
            <div class="enemy-header">
              <svg class="enemy-icon bomber" viewBox="0 0 24 24" fill="#FF0000">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              <h4 class="enemy-title">Bomber</h4>
            </div>
            <div class="enemy-stats">
              <div class="stat-badge hp">80 HP</div>
              <div class="stat-badge speed">Slow Speed</div>
              <div class="stat-badge points">300 Points</div>
            </div>
            <p class="enemy-desc">
              Heavy armored bomber. Slow but very durable. Takes many hits to destroy. High point
              reward. Focus fire to take them down quickly!
            </p>
          </div>

          <div class="enemy-item boss-item">
            <div class="enemy-header">
              <svg class="enemy-icon boss" viewBox="0 0 24 24" fill="#FF00FF">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                <path d="M12 8v8M8 12h8" stroke="#FFF" stroke-width="2" />
              </svg>
              <h4 class="enemy-title">Boss</h4>
            </div>
            <div class="enemy-stats">
              <div class="stat-badge hp">2000 HP</div>
              <div class="stat-badge speed">Variable Speed</div>
              <div class="stat-badge points">3000 Points</div>
            </div>
            <p class="enemy-desc">
              Massive command ship with multiple attack phases. Requires strategy and skill to
              defeat. Collision with player does NOT destroy the boss - you must use your weapons!
              Watch for phase changes at 66% and 33% health.
            </p>
            <div class="boss-warning">
              <svg
                class="warning-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Extreme threat! Prepare for intense battle.</span>
            </div>
          </div>
        </div>
      {/if}

      {#if activeSection === 'powerups'}
        <div class="flex flex-col gap-6">
          <div class="section-header">
            <svg
              class="section-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
            <h3 class="section-title">Power-Ups</h3>
          </div>

          <div class="powerup-item health">
            <div class="powerup-header">
              <svg
                class="powerup-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#00FF88"
                stroke-width="2"
              >
                <path
                  d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                />
              </svg>
              <h4 class="powerup-title">Health Restore</h4>
            </div>
            <p class="powerup-desc">
              Restores 30 HP. Cannot exceed maximum health. Essential for survival in tough battles.
            </p>
          </div>

          <div class="powerup-item weapon">
            <div class="powerup-header">
              <svg
                class="powerup-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FF6600"
                stroke-width="2"
              >
                <path d="M15 15l-6 6m0 0l-3-3m3 3V10M9 9L3 3m0 0l3 3M3 3h7" />
              </svg>
              <h4 class="powerup-title">Weapon Upgrade</h4>
            </div>
            <p class="powerup-desc">
              Temporarily upgrades your weapon to DOUBLE, TRIPLE, or SPREAD shot. Lasts 15 seconds.
              Massive firepower boost!
            </p>
          </div>

          <div class="powerup-item shield">
            <div class="powerup-header">
              <svg
                class="powerup-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0088FF"
                stroke-width="2"
              >
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
              </svg>
              <h4 class="powerup-title">Energy Shield</h4>
            </div>
            <p class="powerup-desc">
              Grants a protective shield that blocks one hit from any source. Lasts 10 seconds or
              until destroyed. Your blue glow indicates active shield.
            </p>
          </div>

          <div class="powerup-item speed">
            <div class="powerup-header">
              <svg
                class="powerup-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFF00"
                stroke-width="2"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <h4 class="powerup-title">Speed Boost</h4>
            </div>
            <p class="powerup-desc">
              Increases movement speed by 50%. Lasts 8 seconds. Perfect for dodging bullet patterns
              and evading danger!
            </p>
          </div>

          <div class="powerup-item score">
            <div class="powerup-header">
              <svg
                class="powerup-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#AA00FF"
                stroke-width="2"
              >
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              </svg>
              <h4 class="powerup-title">Score Bonus</h4>
            </div>
            <p class="powerup-desc">
              Instantly grants 500 bonus points. Collect these to boost your high score and achieve
              victory faster!
            </p>
          </div>

          <div class="tip-box">
            <svg
              class="tip-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <div>
              <strong>Pro Tip:</strong> Power-ups spawn more frequently on Easy difficulty. Adjust your
              difficulty strategically based on your skill level. Hard mode gives better scores but fewer
              power-ups!
            </div>
          </div>
        </div>
      {/if}
    </div>

    <div class="text-center">
      <Button label="Close" onClick={() => modalManager.close()} />
    </div>
  </div>
</div>

<style>
  h2 {
    word-spacing: -10px;
    line-height: 115%;
  }

  .modal-bg {
    background: linear-gradient(
      135deg,
      rgba(5, 15, 40, 0.98) 0%,
      rgba(10, 25, 65, 0.98) 50%,
      rgba(5, 15, 40, 0.98) 100%
    );
    border: 2px solid rgba(0, 170, 255, 0.6);
    box-shadow:
      0 0 40px rgba(0, 170, 255, 0.4),
      inset 0 0 60px rgba(0, 100, 200, 0.1);
  }

  .tab-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(0, 0, 0, 0.5);
    border: 2px solid rgba(0, 170, 255, 0.3);
    border-radius: 0.5rem;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Orbitron', sans-serif;
    font-size: 0.8rem;
  }

  .tab-icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  .tab-btn:hover {
    background: rgba(0, 170, 255, 0.2);
    border-color: rgba(0, 170, 255, 0.6);
  }

  .tab-btn.active {
    background: rgba(0, 102, 204, 0.5);
    border-color: #00aaff;
    box-shadow: 0 0 10px rgba(0, 170, 255, 0.5);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .section-icon {
    width: 2rem;
    height: 2rem;
    color: #00aaff;
  }

  .section-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #00aaff;
  }

  .subsection-title {
    font-size: 1.25rem;
    font-weight: bold;
    color: #00aaff;
  }

  .controls-grid {
    margin-bottom: 1.5rem;
  }

  .control-item {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(0, 170, 255, 0.2);
    border-radius: 0.5rem;
    align-items: center;
  }

  .control-keys {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .key {
    display: inline-block;
    padding: 0.5rem 0.75rem;
    background: rgba(0, 0, 0, 0.7);
    border: 2px solid #00aaff;
    border-radius: 0.25rem;
    font-size: 1rem;
    color: #00aaff;
    font-family: 'VT323', monospace;
    min-width: 3rem;
    text-align: center;
  }

  .key.wide {
    min-width: 5rem;
  }

  .or {
    color: #666;
    font-size: 0.875rem;
  }

  .arrow-icon {
    width: 1.5rem;
    height: 1.5rem;
    color: #00aaff;
  }

  .control-label {
    font-size: 0.875rem;
    opacity: 0.9;
  }

  .tip-box {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: rgba(0, 170, 255, 0.1);
    border: 2px solid rgba(0, 170, 255, 0.3);
    border-radius: 0.5rem;
    color: #00aaff;
  }

  .tip-icon {
    width: 1.5rem;
    height: 1.5rem;
    flex-shrink: 0;
  }

  .gamepad-section {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(0, 170, 255, 0.2);
  }

  .gamepad-info {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .gamepad-item {
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.3);
    border-left: 3px solid rgba(0, 170, 255, 0.5);
    border-radius: 0.25rem;
  }

  .mechanic-item,
  .enemy-item,
  .powerup-item {
    padding: 1.5rem;
    background: rgba(0, 0, 0, 0.3);
    border-left: 4px solid #00aaff;
    border-radius: 0.5rem;
  }

  .mechanic-header,
  .enemy-header,
  .powerup-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .mechanic-icon,
  .enemy-icon,
  .powerup-icon {
    width: 2rem;
    height: 2rem;
  }

  .mechanic-title,
  .enemy-title,
  .powerup-title {
    font-size: 1.25rem;
    font-weight: bold;
    color: #00aaff;
  }

  .mechanic-desc,
  .enemy-desc,
  .powerup-desc {
    font-size: 0.9375rem;
    line-height: 1.6;
    opacity: 0.9;
    margin-bottom: 0.75rem;
  }

  .mechanic-list {
    list-style: none;
    padding-left: 0;
    margin-top: 0.75rem;
  }

  .mechanic-list li {
    padding: 0.5rem 0.75rem;
    background: rgba(0, 170, 255, 0.05);
    border-left: 2px solid rgba(0, 170, 255, 0.4);
    margin-bottom: 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }

  .enemy-stats,
  .powerup-stats {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .stat-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: bold;
    border: 1px solid;
  }

  .stat-badge.hp {
    background: rgba(255, 102, 102, 0.2);
    border-color: rgba(255, 102, 102, 0.6);
    color: #ff6666;
  }

  .stat-badge.speed {
    background: rgba(255, 215, 0, 0.2);
    border-color: rgba(255, 215, 0, 0.6);
    color: #ffd700;
  }

  .stat-badge.points {
    background: rgba(0, 255, 136, 0.2);
    border-color: rgba(0, 255, 136, 0.6);
    color: #00ff88;
  }

  .boss-item {
    border-left-color: #ff00ff;
    border-left-width: 6px;
  }

  .boss-warning {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1rem;
    padding: 0.75rem;
    background: rgba(255, 0, 0, 0.1);
    border: 1px solid rgba(255, 0, 0, 0.4);
    border-radius: 0.5rem;
    color: #ff6666;
  }

  .warning-icon {
    width: 1.5rem;
    height: 1.5rem;
    flex-shrink: 0;
  }

  .powerup-item.health {
    border-left-color: #00ff88;
  }

  .powerup-item.weapon {
    border-left-color: #ff6600;
  }

  .powerup-item.shield {
    border-left-color: #0088ff;
  }

  .powerup-item.speed {
    border-left-color: #ffff00;
  }

  .powerup-item.score {
    border-left-color: #aa00ff;
  }

  .rotate-180 {
    transform: rotate(180deg);
  }

  .-rotate-90 {
    transform: rotate(-90deg);
  }

  .rotate-90 {
    transform: rotate(90deg);
  }
</style>
