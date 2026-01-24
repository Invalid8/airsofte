<script lang="ts">
  import { fly, fade } from 'svelte/transition'
  import Button from '../components/Button.svelte'
  import type { StoryMission } from '../types/gameTypes'

  let {
    mission,
    onStart,
    onCancel
  }: {
    mission: StoryMission
    onStart: () => void
    onCancel: () => void
  } = $props()
</script>

<div class="briefing-overlay" in:fade={{ duration: 300 }}>
  <div class="briefing-screen scroll" in:fly={{ y: -30, duration: 500, delay: 200 }}>
    <div class="briefing-header">
      <div class="mission-badge">Mission {mission.id}</div>
      <h1 class="mission-title title">{mission.title}</h1>
      <p class="mission-description">{mission.description}</p>
    </div>

    <div class="briefing-content">
      <div class="section objectives-section">
        <h2 class="section-title">
          <span class="title-icon">▸</span>
          <span>Objectives</span>
        </h2>
        <div class="objectives-list">
          {#each mission.objectives as objective, i (i)}
            <div class="objective-item">
              <div class="objective-number">{i + 1}</div>
              <div class="objective-details">
                <div class="objective-desc">{objective.description}</div>
                <div class="objective-target">
                  Target: <strong>{objective.target}</strong>
                  {objective.type === 'SURVIVE' ? 'seconds' : ''}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="section intel-section">
        <h2 class="section-title">
          <span class="title-icon">■</span>
          <span>Intel Report</span>
        </h2>
        <div class="intel-grid">
          <div class="intel-item">
            <div class="intel-label">Waves</div>
            <div class="intel-value hud">{mission.waves.length}</div>
          </div>
          <div class="intel-item">
            <div class="intel-label">Enemy Types</div>
            <div class="intel-value hud">
              {new Set(mission.waves.flatMap((w) => w.enemies.map((e) => e.type))).size}
            </div>
          </div>
          <div class="intel-item">
            <div class="intel-label">Difficulty</div>
            <div class="intel-value hud">
              {mission.hasBoss ? 'EXTREME' : mission.waves.length > 3 ? 'HIGH' : 'MEDIUM'}
            </div>
          </div>
          <div class="intel-item">
            <div class="intel-label">Boss</div>
            <div class="intel-value hud">
              {mission.hasBoss ? 'YES' : 'NO'}
            </div>
          </div>
        </div>

        {#if mission.hasBoss}
          <div class="boss-warning">
            <div class="warning-indicator"></div>
            <div class="warning-content">
              <div class="warning-title">Boss Encounter Detected</div>
              <div class="warning-text">
                This mission contains a boss-class enemy. Ensure you are adequately prepared.
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <div class="briefing-actions">
      <Button label="Launch Mission" onClick={onStart} isFirst={true} />
      <Button label="Cancel" onClick={onCancel} />
    </div>
  </div>
</div>

<style>
  .briefing-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(0, 0, 0, 0.623);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .briefing-screen {
    max-width: 56rem;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    background: linear-gradient(135deg, rgba(0, 15, 40, 0.95) 0%, rgba(0, 30, 60, 0.95) 100%);
    border: 2px solid rgba(0, 170, 255, 0.5);
    border-radius: 1rem;
    box-shadow: 0 0 60px rgba(0, 170, 255, 0.4);
  }

  .briefing-header {
    text-align: center;
    padding: 2.5rem 2rem 2rem;
    border-bottom: 1px solid rgba(0, 170, 255, 0.2);
    background: linear-gradient(180deg, rgba(0, 170, 255, 0.05) 0%, transparent 100%);
  }

  .mission-badge {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: rgba(0, 170, 255, 0.2);
    border: 1px solid rgba(0, 170, 255, 0.5);
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: bold;
    margin-bottom: 1rem;
    text-transform: uppercase;
  }

  .mission-title {
    font-size: 2.5rem;
    text-transform: uppercase;
    margin-bottom: 1rem;
    word-spacing: -10px;
    line-height: 110%;
    color: #00aaff;
    text-shadow: 0 0 20px rgba(0, 170, 255, 0.6);
  }

  .mission-description {
    font-size: 1.125rem;
    opacity: 0.9;
    max-width: 40rem;
    margin: 0 auto;
    line-height: 1.6;
  }

  .briefing-content {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .section {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(0, 170, 255, 0.2);
    border-radius: 0.75rem;
    padding: 1.5rem;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 1.5rem;
    color: #00aaff;
  }

  .title-icon {
    font-size: 1.25rem;
    color: rgba(0, 170, 255, 0.8);
  }

  .objectives-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .objective-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.3);
    border-left: 3px solid rgba(0, 170, 255, 0.5);
    border-radius: 0.5rem;
    transition: all 0.2s;
  }

  .objective-item:hover {
    background: rgba(0, 170, 255, 0.05);
    border-left-color: rgba(0, 170, 255, 0.8);
  }

  .objective-number {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: rgba(0, 170, 255, 0.2);
    border: 2px solid rgba(0, 170, 255, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    flex-shrink: 0;
  }

  .objective-details {
    flex: 1;
  }

  .objective-desc {
    font-size: 1.125rem;
    margin-bottom: 0.25rem;
  }

  .objective-target {
    font-size: 0.875rem;
    opacity: 0.7;
  }

  .intel-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .intel-item {
    text-align: center;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(0, 170, 255, 0.2);
    border-radius: 0.5rem;
  }

  .intel-label {
    font-size: 0.875rem;
    opacity: 0.7;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
  }

  .intel-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #00aaff;
  }

  .boss-warning {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: rgba(255, 0, 0, 0.1);
    border: 2px solid rgba(255, 0, 0, 0.4);
    border-radius: 0.5rem;
    position: relative;
    overflow: hidden;
  }

  .boss-warning::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(
      180deg,
      rgba(255, 0, 0, 0.8) 0%,
      rgba(255, 100, 0, 0.8) 50%,
      rgba(255, 0, 0, 0.8) 100%
    );
    animation: warning-pulse 2s ease-in-out infinite;
  }

  @keyframes warning-pulse {
    0%,
    100% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
  }

  .warning-indicator {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: rgba(255, 0, 0, 0.2);
    border: 3px solid rgba(255, 0, 0, 0.6);
    flex-shrink: 0;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .warning-indicator::before {
    content: '!';
    font-size: 1.5rem;
    font-weight: bold;
    color: #ff6666;
  }

  .warning-content {
    flex: 1;
  }

  .warning-title {
    font-size: 1.125rem;
    font-weight: bold;
    color: #ff6666;
    margin-bottom: 0.25rem;
  }

  .warning-text {
    font-size: 0.875rem;
    opacity: 0.9;
  }

  .briefing-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    padding: 2rem;
    border-top: 1px solid rgba(0, 170, 255, 0.2);
    background: linear-gradient(180deg, transparent 0%, rgba(0, 170, 255, 0.05) 100%);
  }

  @media (max-width: 640px) {
    .briefing-header {
      padding: 1.5rem 1rem;
    }

    .mission-title {
      font-size: 2rem;
    }

    .briefing-content {
      padding: 1.5rem 1rem;
    }

    .intel-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
