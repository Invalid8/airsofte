<script lang="ts">
  import { onMount } from 'svelte'
  import { geminiApiClient } from '../utils/geminiApiClient'
  import Button from '../components/Button.svelte'
  import { navigateTo } from '../stores/gameStore'
  import { aiMissionStore } from '../stores/aiMissionStore'
  import type { StoryMission } from '../types/gameTypes'
  import { fly } from 'svelte/transition'
  import BackBtn from '../components/BackBtn.svelte'

  const MAX_GENERATIONS_PER_HOUR = 5
  const RATE_LIMIT_KEY = 'ai_mission_generation_history'

  type GenerationRecord = {
    timestamp: number
  }

  let difficulty = $state<'Easy' | 'Normal' | 'Hard'>('Normal')
  let theme = $state('')
  let waveCount = $state(3)
  let isGenerating = $state(false)
  let error = $state<string | null>(null)
  let generatedMission = $state<StoryMission | null>(null)
  let remainingGenerations = $state(MAX_GENERATIONS_PER_HOUR)

  function getGenerationHistory(): GenerationRecord[] {
    const stored = localStorage.getItem(RATE_LIMIT_KEY)
    if (!stored) return []
    try {
      const history = JSON.parse(stored) as GenerationRecord[]
      const oneHourAgo = Date.now() - 60 * 60 * 1000
      return history.filter((record) => record.timestamp > oneHourAgo)
    } catch {
      return []
    }
  }

  function saveGenerationHistory(history: GenerationRecord[]): void {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(history))
  }

  function canGenerate(): boolean {
    const history = getGenerationHistory()
    return history.length < MAX_GENERATIONS_PER_HOUR
  }

  function recordGeneration(): void {
    const history = getGenerationHistory()
    history.push({ timestamp: Date.now() })
    saveGenerationHistory(history)
    updateRemainingGenerations()
  }

  function updateRemainingGenerations(): void {
    const history = getGenerationHistory()
    remainingGenerations = MAX_GENERATIONS_PER_HOUR - history.length
  }

  async function handleGenerate() {
    if (!canGenerate()) {
      error = `Rate limit reached. You can generate ${MAX_GENERATIONS_PER_HOUR} missions per hour. Please try again later.`
      return
    }

    if (isGenerating) return
    isGenerating = true
    error = null
    generatedMission = null

    try {
      const missionData = (await geminiApiClient.generateMission({
        difficulty,
        theme: theme || undefined,
        waveCount
      })) as StoryMission

      const nextId = 1000 + Date.now()

      generatedMission = {
        id: nextId,
        title: missionData.title,
        description: missionData.description,
        unlocked: true,
        completed: false,
        stars: 0,
        objectives: missionData.objectives.map((obj) => ({
          ...obj,
          current: 0
        })),
        waves: missionData.waves.map((wave, index) => ({
          id: index + 1,
          ...wave,
          completed: false
        })),
        dialogue: missionData.dialogue,
        hasBoss: false
      }

      recordGeneration()
    } catch (err: any) {
      error = err.message
    } finally {
      isGenerating = false
    }
  }

  function handlePlayMission() {
    if (!generatedMission) return

    aiMissionStore.setMission(generatedMission)

    navigateTo('AI_MISSION_PLAY')
  }

  onMount(() => {
    updateRemainingGenerations()
  })
</script>

<div class="mission-creator-screen">
  <BackBtn />

  <div class="mission-creator-container">
    <div class="header">
      <h1 class="title">AI Mission Generator</h1>
      <p class="subtitle">Create custom missions powered by AI</p>
      <div class="rate-limit-info">
        {remainingGenerations} / {MAX_GENERATIONS_PER_HOUR} generations remaining this hour
      </div>
    </div>

    <div class="generator-section">
      <div class="config-panel">
        <h2 class="panel-title">Mission Configuration</h2>

        <div class="config-grid">
          <div class="config-field">
            <label class="config-label">
              <span class="label-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <span>Difficulty Level</span>
            </label>
            <div class="difficulty-selector">
              <button
                class="difficulty-btn"
                class:active={difficulty === 'Easy'}
                onclick={() => (difficulty = 'Easy')}
                disabled={isGenerating}
              >
                <span class="difficulty-indicator easy"></span>
                Easy
              </button>
              <button
                class="difficulty-btn"
                class:active={difficulty === 'Normal'}
                onclick={() => (difficulty = 'Normal')}
                disabled={isGenerating}
              >
                <span class="difficulty-indicator normal"></span>
                Normal
              </button>
              <button
                class="difficulty-btn"
                class:active={difficulty === 'Hard'}
                onclick={() => (difficulty = 'Hard')}
                disabled={isGenerating}
              >
                <span class="difficulty-indicator hard"></span>
                Hard
              </button>
            </div>
          </div>

          <div class="config-field">
            <label class="config-label">
              <span class="label-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
                    fill="currentColor"
                  />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                  <path
                    d="M12 7L13 10L16 11L13 12L12 15L11 12L8 11L11 10L12 7Z"
                    fill="currentColor"
                    opacity="0.6"
                  />
                </svg>
              </span>
              <span>Mission Theme</span>
            </label>
            <input
              type="text"
              class="theme-input"
              bind:value={theme}
              placeholder="e.g., asteroid field, nebula combat, space station defense"
              disabled={isGenerating}
            />
            <span class="field-hint">Optional - Leave blank for random theme</span>
          </div>

          <div class="config-field">
            <label class="config-label">
              <span class="label-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor" />
                  <rect x="3" y="13" width="7" height="7" rx="1" fill="currentColor" />
                  <rect x="13" y="3" width="7" height="7" rx="1" fill="currentColor" />
                  <rect x="13" y="13" width="7" height="7" rx="1" fill="currentColor" />
                </svg>
              </span>
              <span>Wave Count</span>
            </label>
            <div class="wave-controls">
              <button
                class="wave-btn"
                onclick={() => (waveCount = Math.max(2, waveCount - 1))}
                disabled={isGenerating || waveCount <= 2}
              >
                −
              </button>
              <div class="wave-display">
                <span class="wave-number hud">{waveCount}</span>
                <span class="wave-label">Waves</span>
              </div>
              <button
                class="wave-btn"
                onclick={() => (waveCount = Math.min(10, waveCount + 1))}
                disabled={isGenerating || waveCount >= 10}
              >
                +
              </button>
            </div>
            <span class="field-hint">Range: 2-10 waves</span>
          </div>
        </div>

        <div class="generate-action">
          <Button
            label={isGenerating
              ? 'Generating Mission...'
              : canGenerate()
                ? 'Generate Mission'
                : 'Rate Limit Reached'}
            onClick={handleGenerate}
            disabled={isGenerating || !canGenerate()}
            isFirst={true}
          />
        </div>
      </div>

      {#if error}
        <div class="error-panel" in:fly={{ y: 20, duration: 300 }}>
          <div class="error-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"
                fill="#ff6666"
              />
            </svg>
          </div>
          <div class="error-content">
            <h3 class="error-title">Generation Failed</h3>
            <p class="error-message">{error}</p>
          </div>
        </div>
      {/if}

      {#if generatedMission}
        <div class="mission-preview" in:fly={{ y: 30, duration: 400 }}>
          <div class="preview-header">
            <div class="preview-badge">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="currentColor"
                />
              </svg>
              Mission Generated
            </div>
            <h2 class="preview-title">{generatedMission.title}</h2>
          </div>

          <div class="preview-content">
            <div class="preview-section">
              <h3 class="section-heading">
                <span class="section-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
                      fill="currentColor"
                      opacity="0.3"
                    />
                    <path d="M14 2L20 8H14V2Z" fill="currentColor" />
                    <path
                      d="M8 12H16M8 16H16M8 8H13"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                  </svg>
                </span>
                Mission Brief
              </h3>
              <p class="mission-description">{generatedMission.description}</p>
            </div>

            <div class="preview-section">
              <h3 class="section-heading">
                <span class="section-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                    <circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="2" />
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                  </svg>
                </span>
                Objectives ({generatedMission.objectives.length})
              </h3>
              <div class="objectives-list">
                {#each generatedMission.objectives as obj, i}
                  <div class="objective-item">
                    <span class="objective-number">{i + 1}</span>
                    <span class="objective-text">{obj.description}</span>
                  </div>
                {/each}
              </div>
            </div>

            <div class="preview-section">
              <h3 class="section-heading">
                <span class="section-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z"
                      stroke="currentColor"
                      stroke-width="2"
                    />
                    <path
                      d="M4 12C4 12 6 8 12 8C18 8 20 12 20 12C20 12 18 16 12 16C6 16 4 12 4 12Z"
                      stroke="currentColor"
                      stroke-width="2"
                    />
                    <path
                      d="M6 12C6 12 8 10 12 10C16 10 18 12 18 12C18 12 16 14 12 14C8 14 6 12 6 12Z"
                      stroke="currentColor"
                      stroke-width="2"
                    />
                  </svg>
                </span>
                Wave Structure
              </h3>
              <div class="waves-summary">
                <div class="wave-stat">
                  <span class="wave-stat-value hud">{generatedMission.waves.length}</span>
                  <span class="wave-stat-label">Total Waves</span>
                </div>
                <div class="wave-stat">
                  <span class="wave-stat-value hud">{difficulty}</span>
                  <span class="wave-stat-label">Difficulty</span>
                </div>
              </div>
            </div>
          </div>

          <div class="preview-actions">
            <Button label="Launch Mission" onClick={handlePlayMission} isFirst={true} />
            <Button label="Generate Another" onClick={handleGenerate} disabled={isGenerating} />
          </div>
        </div>
      {/if}

      {#if isGenerating}
        <div class="loading-overlay" in:fly={{ duration: 300 }}>
          <div class="loading-spinner"></div>
          <p class="loading-text">Generating mission...</p>
          <p class="loading-subtext">AI is crafting your unique space adventure</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* All existing styles from the original file */
  .mission-creator-screen {
    min-height: 100vh;
    padding: 6rem 2rem 2rem;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .mission-creator-container {
    max-width: 900px;
    margin: 0 auto;
  }

  .header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .title {
    font-size: clamp(2.5rem, 5vw, 3.5rem);
    text-transform: uppercase;
    word-spacing: -20px;
    line-height: 110%;
    color: #00aaff;
    text-shadow: 0 0 30px rgba(0, 170, 255, 0.6);
    margin-bottom: 1rem;
  }

  .subtitle {
    font-size: 1rem;
    opacity: 0.7;
    color: rgba(255, 255, 255, 0.8);
  }

  .generator-section {
    position: relative;
  }

  .config-panel {
    background: rgba(0, 0, 0, 0.7);
    border: 2px solid rgba(0, 170, 255, 0.4);
    border-radius: 1rem;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 8px 32px rgba(0, 170, 255, 0.15);
  }

  .panel-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #00aaff;
    text-transform: uppercase;
    margin-bottom: 2rem;
    text-align: center;
  }

  .config-grid {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    margin-bottom: 2rem;
  }

  .config-field {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .config-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.9);
    letter-spacing: 0.05em;
  }

  .label-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .label-icon svg {
    display: block;
  }

  .difficulty-selector {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .difficulty-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.5);
    border: 2px solid rgba(0, 170, 255, 0.3);
    border-radius: 0.5rem;
    color: white;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .difficulty-btn:hover:not(:disabled) {
    border-color: rgba(0, 170, 255, 0.6);
    background: rgba(0, 170, 255, 0.1);
    transform: translateY(-2px);
  }

  .difficulty-btn.active {
    border-color: rgba(0, 170, 255, 1);
    background: rgba(0, 170, 255, 0.2);
    box-shadow: 0 0 16px rgba(0, 170, 255, 0.4);
  }

  .difficulty-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .difficulty-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .difficulty-indicator.easy {
    background: #00ff88;
    box-shadow: 0 0 8px #00ff88;
  }

  .difficulty-indicator.normal {
    background: #ffd700;
    box-shadow: 0 0 8px #ffd700;
  }

  .difficulty-indicator.hard {
    background: #ff4444;
    box-shadow: 0 0 8px #ff4444;
  }

  .theme-input {
    width: 100%;
    padding: 0.875rem 1rem;
    background: rgba(0, 0, 0, 0.5);
    border: 2px solid rgba(0, 170, 255, 0.4);
    border-radius: 0.5rem;
    color: white;
    font-size: 1rem;
    transition: all 0.2s;
  }

  .theme-input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  .theme-input:focus {
    outline: none;
    border-color: rgba(0, 170, 255, 1);
    box-shadow: 0 0 16px rgba(0, 170, 255, 0.3);
  }

  .theme-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .field-hint {
    font-size: 0.75rem;
    opacity: 0.6;
    font-style: italic;
  }

  .wave-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 0.5rem;
  }

  .wave-btn {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 170, 255, 0.2);
    border: 2px solid rgba(0, 170, 255, 0.5);
    border-radius: 0.5rem;
    color: white;
    font-size: 1.5rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
  }

  .wave-btn:hover:not(:disabled) {
    background: rgba(0, 170, 255, 0.3);
    border-color: rgba(0, 170, 255, 1);
    transform: scale(1.05);
  }

  .wave-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .wave-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 100px;
  }

  .wave-number {
    font-size: 2.5rem;
    font-weight: bold;
    color: #00aaff;
    line-height: 1;
  }

  .wave-label {
    font-size: 0.75rem;
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .generate-action {
    display: flex;
    justify-content: center;
    margin-top: 2rem;
  }

  .error-panel {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    background: rgba(255, 0, 0, 0.1);
    border: 2px solid rgba(255, 0, 0, 0.4);
    border-radius: 1rem;
    margin-bottom: 2rem;
  }

  .error-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .error-content {
    flex: 1;
  }

  .error-title {
    font-size: 1.125rem;
    font-weight: bold;
    color: #ff6666;
    margin-bottom: 0.5rem;
  }

  .error-message {
    font-size: 0.9375rem;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.5;
  }

  .mission-preview {
    background: rgba(0, 0, 0, 0.8);
    border: 2px solid rgba(0, 170, 255, 0.6);
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 0 40px rgba(0, 170, 255, 0.3);
  }

  .preview-header {
    text-align: center;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid rgba(0, 170, 255, 0.3);
  }

  .preview-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(0, 255, 136, 0.2);
    border: 1px solid rgba(0, 255, 136, 0.5);
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 600;
    color: #00ff88;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 1rem;
  }

  .preview-badge svg {
    flex-shrink: 0;
  }

  .preview-title {
    font-size: 2rem;
    font-weight: bold;
    color: #00aaff;
    text-shadow: 0 0 20px rgba(0, 170, 255, 0.5);
  }

  .preview-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    margin-bottom: 2rem;
    max-height: 60vh;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 0.5rem;
  }

  .preview-content::-webkit-scrollbar {
    width: 8px;
  }

  .preview-content::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
  }

  .preview-content::-webkit-scrollbar-thumb {
    background: rgba(0, 170, 255, 0.5);
    border-radius: 4px;
  }

  .preview-content::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 170, 255, 0.7);
  }

  .preview-section {
    background: rgba(0, 170, 255, 0.05);
    border: 1px solid rgba(0, 170, 255, 0.2);
    border-radius: 0.75rem;
    padding: 1.5rem;
  }

  .section-heading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.125rem;
    font-weight: bold;
    color: #00aaff;
    margin-bottom: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .section-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .section-icon svg {
    display: block;
  }

  .mission-description {
    font-size: 1rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.85);
  }

  .objectives-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-height: 400px;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 0.5rem;
  }

  .objectives-list::-webkit-scrollbar {
    width: 6px;
  }

  .objectives-list::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }

  .objectives-list::-webkit-scrollbar-thumb {
    background: rgba(0, 170, 255, 0.4);
    border-radius: 3px;
  }

  .objectives-list::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 170, 255, 0.6);
  }

  .objective-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.3);
    border-left: 3px solid rgba(0, 170, 255, 0.6);
    border-radius: 0.25rem;
  }

  .objective-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: rgba(0, 170, 255, 0.3);
    border-radius: 50%;
    font-size: 0.875rem;
    font-weight: bold;
    color: #00aaff;
    flex-shrink: 0;
  }

  .objective-text {
    flex: 1;
    font-size: 0.9375rem;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.9);
  }

  .waves-summary {
    display: flex;
    gap: 2rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .wave-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem 2rem;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 0.5rem;
  }

  .wave-stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: #00aaff;
    margin-bottom: 0.25rem;
  }

  .wave-stat-label {
    font-size: 0.875rem;
    opacity: 0.7;
    text-transform: uppercase;
  }

  .preview-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.9);
    border-radius: 1rem;
    backdrop-filter: blur(8px);
    z-index: 10;
    padding: 3rem;
  }

  .loading-spinner {
    width: 64px;
    height: 64px;
    border: 4px solid rgba(0, 170, 255, 0.2);
    border-top-color: #00aaff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1.5rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-text {
    font-size: 1.25rem;
    font-weight: bold;
    color: #00aaff;
    margin-bottom: 0.5rem;
    text-shadow: 0 0 20px rgba(0, 170, 255, 0.6);
  }

  .loading-subtext {
    font-size: 0.9375rem;
    opacity: 0.7;
    text-align: center;
  }

  @media (max-width: 768px) {
    .mission-creator-screen {
      padding: 5rem 1rem 2rem;
    }

    .config-panel,
    .mission-preview {
      padding: 1.5rem;
    }

    .difficulty-selector {
      grid-template-columns: 1fr;
    }

    .preview-title {
      font-size: 1.5rem;
    }

    .wave-controls {
      padding: 0.75rem;
    }

    .wave-btn {
      width: 40px;
      height: 40px;
    }
  }

  .rate-limit-info {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    opacity: 0.7;
    padding: 0.5rem 1rem;
    background: rgba(0, 170, 255, 0.1);
    border-radius: 0.5rem;
    border: 1px solid rgba(0, 170, 255, 0.3);
    text-align: center;
  }
</style>
