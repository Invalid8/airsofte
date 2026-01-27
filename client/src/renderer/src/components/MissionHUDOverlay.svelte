<script lang="ts">
  import { onMount } from 'svelte'
  import { fly, fade } from 'svelte/transition'
  import { gameEvents } from '../lib/eventBus'
  import { objectiveTracker } from '../lib/objectiveTracker'
  import type { StoryMission } from '../types/gameTypes'

  let {
    mission
  }: {
    mission: StoryMission
  } = $props()

  let objectives = $state(mission.objectives)
  let bonusObjectives = $state([])
  let eventMessage = $state<{ text: string; color: string } | null>(null)
  let messageTimeout

  function updateObjectives(): void {
    objectives = [...mission.objectives]
    bonusObjectives = objectiveTracker.getBonusObjectives()
  }

  function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  function getObjectiveProgress(objective): number {
    return Math.min((objective.current / objective.target) * 100, 100)
  }

  function getObjectiveColor(objective): string {
    const progress = getObjectiveProgress(objective)
    if (progress === 100) return '#00ff88'
    if (progress > 50) return '#ffaa00'
    return '#00aaff'
  }

  onMount(() => {
    objectiveTracker.startMission(mission)

    const unsubObjectiveUpdate = gameEvents.on('OBJECTIVE_UPDATED', () => {
      updateObjectives()
    })

    const unsubObjectiveComplete = gameEvents.on('OBJECTIVE_COMPLETED', () => {
      updateObjectives()
    })

    const unsubBonusAdded = gameEvents.on('BONUS_OBJECTIVE_ADDED', () => {
      updateObjectives()
    })

    const unsubMessage = gameEvents.on('SHOW_MESSAGE', (event) => {
      eventMessage = {
        text: event.data.text,
        color: event.data.color || '#ffffff'
      }

      if (messageTimeout) clearTimeout(messageTimeout)
      messageTimeout = setTimeout(() => {
        eventMessage = null
      }, event.data.duration || 3000)
    })

    const surviveInterval = setInterval(() => {
      objectiveTracker.checkSurviveObjective()
      updateObjectives()
    }, 100)

    return () => {
      unsubObjectiveUpdate()
      unsubObjectiveComplete()
      unsubBonusAdded()
      unsubMessage()
      clearInterval(surviveInterval)
      if (messageTimeout) clearTimeout(messageTimeout)
    }
  })
</script>

{#if eventMessage}
  <div
    class="event-message"
    in:fly={{ y: -30, duration: 300 }}
    out:fade={{ duration: 200 }}
    style="color: {eventMessage.color}"
  >
    {eventMessage.text}
  </div>
{/if}

<div class="objectives-panel">
  <div class="panel-header">
    <span class="panel-title">Mission Objectives</span>
    <span class="completion-badge">{objectiveTracker.getCompletionPercentage().toFixed(0)}%</span>
  </div>

  <div class="objectives-list">
    {#each objectives as objective, index (index)}
      {@const progress = getObjectiveProgress(objective)}
      {@const color = getObjectiveColor(objective)}
      {@const isComplete = progress === 100}

      <div class="objective-item" class:completed={isComplete}>
        <div class="objective-header">
          <span class="objective-icon">{isComplete ? '✓' : '◯'}</span>
          <span class="objective-text">{objective.description}</span>
        </div>

        <div class="objective-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: {progress}%; background: {color}"></div>
          </div>
          <span class="progress-text hud">
            {#if objective.type === 'SURVIVE'}
              {formatTime(objective.current)} / {formatTime(objective.target)}
            {:else}
              {objective.current} / {objective.target}
            {/if}
          </span>
        </div>
      </div>
    {/each}

    {#if bonusObjectives.length > 0}
      <div class="bonus-divider">Bonus Objectives</div>
      {#each bonusObjectives as bonus, index (index)}
        {@const progress = (bonus.current / bonus.target) * 100}
        <div class="objective-item bonus">
          <div class="objective-header">
            <span class="objective-icon">⭐</span>
            <span class="objective-text">{bonus.description}</span>
          </div>
          <div class="objective-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: {progress}%; background: #ffd700"></div>
            </div>
            <span class="progress-text hud">{bonus.current} / {bonus.target}</span>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .event-message {
    position: fixed;
    bottom: 20%;
    right: 50%;
    transform: translateX(-50%);
    z-index: 100;
    padding: 1.5rem 2.5rem;
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid currentColor;
    border-radius: 0.75rem;
    font-size: 1.5rem;
    font-weight: bold;
    text-align: center;
    box-shadow: 0 0 30px currentColor;
    pointer-events: none;
    font-family: 'Press Start 2P', cursive;
  }

  .objectives-panel {
    position: fixed;
    bottom: 5rem;
    left: 1.5rem;
    width: 20rem;
    background: rgba(0, 0, 0, 0.85);
    border: 2px solid rgba(0, 170, 255, 0.5);
    border-radius: 0.75rem;
    padding: 1rem;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(0, 170, 255, 0.3);
  }

  .panel-title {
    font-size: 0.875rem;
    font-weight: bold;
    text-transform: uppercase;
    color: #00aaff;
  }

  .completion-badge {
    padding: 0.25rem 0.75rem;
    background: rgba(0, 170, 255, 0.2);
    border: 1px solid rgba(0, 170, 255, 0.5);
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: bold;
  }

  .objectives-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .objective-item {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(0, 170, 255, 0.3);
    border-radius: 0.5rem;
    padding: 0.75rem;
    transition: all 0.3s ease;
  }

  .objective-item.completed {
    border-color: rgba(0, 255, 136, 0.6);
    background: rgba(0, 255, 136, 0.1);
  }

  .objective-item.bonus {
    border-color: rgba(255, 215, 0, 0.6);
    background: rgba(255, 215, 0, 0.1);
  }

  .objective-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .objective-icon {
    font-size: 1rem;
    flex-shrink: 0;
  }

  .objective-text {
    font-size: 0.8125rem;
    line-height: 1.3;
    flex: 1;
  }

  .objective-progress {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .progress-bar {
    flex: 1;
    height: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 0.25rem;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    transition: width 0.3s ease;
    box-shadow: 0 0 8px currentColor;
  }

  .progress-text {
    font-size: 0.75rem;
    font-weight: bold;
    white-space: nowrap;
    min-width: 4rem;
    text-align: right;
  }

  .bonus-divider {
    font-size: 0.75rem;
    font-weight: bold;
    text-transform: uppercase;
    color: #ffd700;
    margin-top: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(255, 215, 0, 0.3);
  }

  @media (max-width: 768px) {
    .objectives-panel {
      width: calc(100% - 2rem);
      right: 1rem;
      left: 1rem;
      top: auto;
      bottom: 6rem;
    }

    .event-message {
      font-size: 1rem;
      padding: 1rem 1.5rem;
    }
  }
</style>
