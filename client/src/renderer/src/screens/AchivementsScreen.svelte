<script lang="ts">
  import { onMount } from 'svelte'
  import { fly } from 'svelte/transition'
  import BackBtn from '../components/BackBtn.svelte'
  import { progressionSystem } from '../lib/progressionSystem'
  import type { Achievement } from '../lib/progressionSystem'

  let unlockedAchievements = $state<Achievement[]>([])
  let lockedAchievements = $state<Achievement[]>([])
  let progression = $state(progressionSystem.getProgression())

  const categoryColors = {
    COMBAT: '#ff6600',
    SURVIVAL: '#00ff88',
    SPECIAL: '#aa00ff',
    COLLECTION: '#ffd700'
  }

  const categoryIcons = {
    COMBAT: '⚔️',
    SURVIVAL: '🛡️',
    SPECIAL: '✨',
    COLLECTION: '📦'
  }

  function formatDate(timestamp: number): string {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  onMount(() => {
    unlockedAchievements = progressionSystem.getUnlockedAchievements()
    lockedAchievements = progressionSystem.getLockedAchievements()
    progression = progressionSystem.getProgression()
  })
</script>

<div class="achievements-screen">
  <BackBtn />

  <div class="achievements-container">
    <div class="header">
      <h1 class="title">Achievements</h1>
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-value hud">{progression.achievementsUnlocked}</span>
          <span class="stat-label">Unlocked</span>
        </div>
        <div class="stat-item">
          <span class="stat-value hud"
            >{unlockedAchievements.length + lockedAchievements.length}</span
          >
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-item">
          <span class="stat-value hud"
            >{Math.round(
              (progression.achievementsUnlocked /
                (unlockedAchievements.length + lockedAchievements.length)) *
                100
            )}%</span
          >
          <span class="stat-label">Completion</span>
        </div>
      </div>
    </div>

    {#if unlockedAchievements.length > 0}
      <section class="achievements-section">
        <h2 class="section-title">Unlocked ({unlockedAchievements.length})</h2>
        <div class="achievements-grid">
          {#each unlockedAchievements as achievement (achievement.id)}
            <div class="achievement-card unlocked" in:fly={{ y: 20, duration: 300 }}>
              <div class="achievement-icon">{achievement.icon}</div>
              <div class="achievement-content">
                <div class="achievement-header">
                  <h3 class="achievement-title">{achievement.title}</h3>
                  <span
                    class="category-badge"
                    style="background: {categoryColors[
                      achievement.category
                    ]}20; color: {categoryColors[achievement.category]}"
                  >
                    {categoryIcons[achievement.category]}
                    {achievement.category}
                  </span>
                </div>
                <p class="achievement-description">{achievement.description}</p>
                {#if achievement.unlockedAt}
                  <div class="achievement-date">
                    Unlocked: {formatDate(achievement.unlockedAt)}
                  </div>
                {/if}
              </div>
              <div class="achievement-checkmark">✓</div>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    {#if lockedAchievements.length > 0}
      <section class="achievements-section">
        <h2 class="section-title">Locked ({lockedAchievements.length})</h2>
        <div class="achievements-grid">
          {#each lockedAchievements as achievement (achievement.id)}
            <div class="achievement-card locked">
              <div class="achievement-icon locked-icon">🔒</div>
              <div class="achievement-content">
                <div class="achievement-header">
                  <h3 class="achievement-title">{achievement.title}</h3>
                  <span class="category-badge locked-badge" style="opacity: 0.5">
                    {categoryIcons[achievement.category]}
                    {achievement.category}
                  </span>
                </div>
                <p class="achievement-description">{achievement.description}</p>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  </div>
</div>

<style>
  .achievements-screen {
    min-height: 100vh;
    padding: 6rem 2rem 2rem;
  }

  .achievements-container {
    max-width: 80rem;
    margin: 0 auto;
  }

  .header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .title {
    font-size: 3.5rem;
    text-transform: uppercase;
    word-spacing: -20px;
    line-height: 110%;
    color: #00aaff;
    text-shadow: 0 0 30px rgba(0, 170, 255, 0.6);
    margin-bottom: 2rem;
  }

  .stats-bar {
    display: flex;
    justify-content: center;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem 2rem;
    background: rgba(0, 0, 0, 0.5);
    border: 2px solid rgba(0, 170, 255, 0.3);
    border-radius: 0.75rem;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: #00aaff;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.875rem;
    opacity: 0.7;
    text-transform: uppercase;
  }

  .achievements-section {
    margin-bottom: 3rem;
  }

  .section-title {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 1.5rem;
    color: #00aaff;
    text-transform: uppercase;
  }

  .achievements-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .achievement-card {
    position: relative;
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    background: rgba(0, 0, 0, 0.6);
    border: 2px solid rgba(0, 170, 255, 0.3);
    border-radius: 1rem;
    transition: all 0.3s ease;
  }

  .achievement-card.unlocked {
    border-color: rgba(0, 255, 136, 0.5);
  }

  .achievement-card.unlocked:hover {
    transform: translateY(-4px);
    border-color: rgba(0, 255, 136, 0.8);
    box-shadow: 0 8px 24px rgba(0, 255, 136, 0.3);
  }

  .achievement-card.locked {
    opacity: 0.6;
  }

  .achievement-icon {
    font-size: 3rem;
    flex-shrink: 0;
  }

  .locked-icon {
    opacity: 0.4;
  }

  .achievement-content {
    flex: 1;
  }

  .achievement-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .achievement-title {
    font-size: 1.125rem;
    font-weight: bold;
    line-height: 1.2;
  }

  .category-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: bold;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .achievement-description {
    font-size: 0.875rem;
    opacity: 0.85;
    line-height: 1.4;
    margin-bottom: 0.5rem;
  }

  .achievement-date {
    font-size: 0.75rem;
    opacity: 0.6;
  }

  .achievement-checkmark {
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 1.5rem;
    color: #00ff88;
  }

  @media (max-width: 768px) {
    .achievements-screen {
      padding: 5rem 1rem 2rem;
    }

    .title {
      font-size: 2.5rem;
    }

    .achievements-grid {
      grid-template-columns: 1fr;
    }

    .stats-bar {
      gap: 1rem;
    }

    .stat-item {
      padding: 0.75rem 1.5rem;
    }
  }
</style>
