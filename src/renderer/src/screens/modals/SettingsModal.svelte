<script lang="ts">
  import { fly } from 'svelte/transition'
  import { onMount } from 'svelte'
  import Button from '../../components/Button.svelte'
  import { toggleSettings, setDifficulty } from '../../stores/gameStore'
  import { StorageManager } from '../../utils/storageManager'
  import { GameSoundManager } from '../../lib/sounds'
  import type { GameSettings } from '../../types/gameTypes'

  let settings = $state<GameSettings>({
    volume: {
      master: 1.0,
      music: 0.8,
      sfx: 0.5
    },
    difficulty: 'Normal',
    keyBindings: {
      up: 'w',
      down: 's',
      left: 'a',
      right: 'd',
      shoot: ' ',
      special: 'Shift',
      pause: 'Escape'
    },
    graphics: {
      particles: true,
      screenShake: true,
      showFPS: false
    }
  })

  let activeTab: 'audio' | 'gameplay' | 'controls' | 'graphics' = $state('audio')
  let hasChanges = $state(false)

  onMount(() => {
    settings = StorageManager.getSettings()
  })

  function handleVolumeChange(type: 'master' | 'music' | 'sfx', value: number): void {
    settings.volume[type] = value
    hasChanges = true

    if (type === 'master') {
      GameSoundManager.setVolume(value)
    }
  }

  function handleDifficultyChange(difficulty: GameSettings['difficulty']): void {
    settings.difficulty = difficulty
    setDifficulty(difficulty)
    hasChanges = true
  }

  function toggleGraphicsSetting(setting: keyof GameSettings['graphics']): void {
    settings.graphics[setting] = !settings.graphics[setting]
    hasChanges = true
  }

  function saveSettings(): void {
    StorageManager.saveSettings(settings)
    GameSoundManager.setVolume(settings.volume.master)
    hasChanges = false
  }

  function resetToDefaults(): void {
    settings = {
      volume: { master: 1.0, music: 0.8, sfx: 0.5 },
      difficulty: 'Normal',
      keyBindings: {
        up: 'w',
        down: 's',
        left: 'a',
        right: 'd',
        shoot: ' ',
        special: 'Shift',
        pause: 'Escape'
      },
      graphics: {
        particles: true,
        screenShake: true,
        showFPS: false
      }
    }
    hasChanges = true
  }

  function close(): void {
    if (hasChanges) {
      saveSettings()
    }
    toggleSettings()
  }
</script>

<div class="overlay fixed size-full top-0 left-0 right-0 bottom-0 bg-black/70 z-[999]"></div>

<div
  class="settings-modal fixed w-full max-w-2xl rounded-xl bg-white/10 space-1-bg p-6 pt-8 z-[999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-auto scroll"
  in:fly={{ y: 200, duration: 500 }}
>
  <div class="content flex flex-col gap-6">
    <h2 class="title text-3xl uppercase glow-text-2 text-center">Settings</h2>

    <div class="tabs grid grid-cols-4 gap-2 border-b-2 border-cyan-500/30 pb-2">
      <button
        class="tab-btn"
        class:active={activeTab === 'audio'}
        onclick={() => (activeTab = 'audio')}
      >
        Audio
      </button>
      <button
        class="tab-btn"
        class:active={activeTab === 'gameplay'}
        onclick={() => (activeTab = 'gameplay')}
      >
        Gameplay
      </button>
      <button
        class="tab-btn"
        class:active={activeTab === 'controls'}
        onclick={() => (activeTab = 'controls')}
      >
        Controls
      </button>
      <button
        class="tab-btn"
        class:active={activeTab === 'graphics'}
        onclick={() => (activeTab = 'graphics')}
      >
        Graphics
      </button>
    </div>

    <div class="tab-content min-h-[300px]">
      {#if activeTab === 'audio'}
        <div class="flex-col gap-6">
          <div class="setting-item">
            <label class="flex justify-between items-center mb-2">
              <span class="text-lg">Master Volume</span>
              <span class="text-cyan-400 hud">{Math.round(settings.volume.master * 100)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.volume.master}
              oninput={(e) => handleVolumeChange('master', parseFloat(e.currentTarget.value))}
              class="volume-slider"
            />
          </div>

          <div class="setting-item">
            <label class="flex justify-between items-center mb-2">
              <span class="text-lg">Music Volume</span>
              <span class="text-cyan-400 hud">{Math.round(settings.volume.music * 100)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.volume.music}
              oninput={(e) => handleVolumeChange('music', parseFloat(e.currentTarget.value))}
              class="volume-slider"
            />
          </div>

          <div class="setting-item">
            <label class="flex justify-between items-center mb-2">
              <span class="text-lg">SFX Volume</span>
              <span class="text-cyan-400 hud">{Math.round(settings.volume.sfx * 100)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.volume.sfx}
              oninput={(e) => handleVolumeChange('sfx', parseFloat(e.currentTarget.value))}
              class="volume-slider"
            />
          </div>
        </div>
      {/if}

      {#if activeTab === 'gameplay'}
        <div class="flex-col gap-6">
          <div class="setting-item">
            <label class="block text-lg mb-3">Difficulty</label>
            <div class="grid grid-cols-3 gap-3">
              {#each ['Easy', 'Normal', 'Hard'] as diff, i (i)}
                <button
                  class="difficulty-btn"
                  class:active={settings.difficulty === diff}
                  onclick={() => handleDifficultyChange(diff as GameSettings['difficulty'])}
                >
                  {diff}
                </button>
              {/each}
            </div>
            <div class="mt-3 text-sm opacity-70">
              {#if settings.difficulty === 'Easy'}
                Enemies have less health and deal less damage. More power-ups.
              {:else if settings.difficulty === 'Normal'}
                Balanced experience for most players.
              {:else}
                Enemies are tougher and faster. Fewer power-ups. Higher scores!
              {/if}
            </div>
          </div>
        </div>
      {/if}

      {#if activeTab === 'controls'}
        <div class="flex-col gap-4">
          <div class="controls-grid grid grid-cols-2 gap-4">
            {#each Object.entries(settings.keyBindings) as [action, key], i (i)}
              <div class="control-item">
                <span class="capitalize">{action}:</span>
                <kbd class="key-display">{key === ' ' ? 'Space' : key}</kbd>
              </div>
            {/each}
          </div>
          <div class="mt-4 p-4 bg-black/30 border border-cyan-500/30 rounded text-sm">
            <strong>Note:</strong> Key remapping will be available in a future update. Current controls
            are fixed.
          </div>
        </div>
      {/if}

      {#if activeTab === 'graphics'}
        <div class="flex-col gap-4">
          <div class="setting-item">
            <label class="flex items-center justify-between">
              <span class="text-lg">Particle Effects</span>
              <button
                class="toggle-btn"
                class:active={settings.graphics.particles}
                onclick={() => toggleGraphicsSetting('particles')}
              >
                {settings.graphics.particles ? 'ON' : 'OFF'}
              </button>
            </label>
            <p class="text-sm opacity-70 mt-1">Show explosions and visual effects</p>
          </div>

          <div class="setting-item">
            <label class="flex items-center justify-between">
              <span class="text-lg">Screen Shake</span>
              <button
                class="toggle-btn"
                class:active={settings.graphics.screenShake}
                onclick={() => toggleGraphicsSetting('screenShake')}
              >
                {settings.graphics.screenShake ? 'ON' : 'OFF'}
              </button>
            </label>
            <p class="text-sm opacity-70 mt-1">Shake effect on damage and explosions</p>
          </div>

          <div class="setting-item">
            <label class="flex items-center justify-between">
              <span class="text-lg">Show FPS</span>
              <button
                class="toggle-btn"
                class:active={settings.graphics.showFPS}
                onclick={() => toggleGraphicsSetting('showFPS')}
              >
                {settings.graphics.showFPS ? 'ON' : 'OFF'}
              </button>
            </label>
            <p class="text-sm opacity-70 mt-1">Display frames per second counter</p>
          </div>
        </div>
      {/if}
    </div>

    <div class="actions flex gap-3 justify-center flex-wrap">
      <Button label="Save & Close" onClick={close} />
      <Button label="Reset Defaults" onClick={resetToDefaults} />
    </div>

    {#if hasChanges}
      <div class="text-center text-yellow-400 text-sm">You have unsaved changes</div>
    {/if}
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

  .volume-slider {
    width: 100%;
    height: 8px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.5);
    outline: none;
    -webkit-appearance: none;
  }

  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #00aaff;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(0, 170, 255, 0.8);
  }

  .volume-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #00aaff;
    cursor: pointer;
    border: none;
    box-shadow: 0 0 10px rgba(0, 170, 255, 0.8);
  }

  .difficulty-btn {
    padding: 1rem;
    background: rgba(0, 0, 0, 0.5);
    border: 2px solid rgba(0, 170, 255, 0.3);
    border-radius: 0.5rem;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Press Start 2P', cursive;
    font-size: 0.8rem;
  }

  .difficulty-btn:hover {
    background: rgba(0, 170, 255, 0.2);
  }

  .difficulty-btn.active {
    background: rgba(0, 102, 204, 0.5);
    border-color: #00aaff;
    box-shadow: 0 0 10px rgba(0, 170, 255, 0.5);
  }

  .toggle-btn {
    padding: 0.5rem 1.5rem;
    background: rgba(255, 0, 0, 0.3);
    border: 2px solid rgba(255, 0, 0, 0.5);
    border-radius: 0.5rem;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'VT323', monospace;
    font-size: 1.2rem;
    min-width: 80px;
  }

  .toggle-btn.active {
    background: rgba(0, 255, 0, 0.3);
    border-color: rgba(0, 255, 0, 0.5);
  }

  .key-display {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: rgba(0, 0, 0, 0.7);
    border: 2px solid #00aaff;
    border-radius: 0.25rem;
    font-family: 'VT323', monospace;
    font-size: 1.1rem;
    color: #00aaff;
    min-width: 60px;
    text-align: center;
  }

  .control-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(0, 170, 255, 0.2);
    border-radius: 0.5rem;
  }

  .setting-item {
    background: rgba(0, 0, 0, 0.3);
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(0, 170, 255, 0.2);
  }
</style>
