<script lang="ts">
  import { onMount } from 'svelte'
  import Options from '../../components/Options.svelte'
  import { modalManager } from '../../utils/ModalManager'
  import { StorageManager } from '../../utils/storageManager'
  import { currentUser } from '../../utils/userManager'
  import { cn, formatNumberWithCommas } from '../../lib/utils'
  import type { HighScore } from '../../types/gameTypes'

  let tab: 'quick_play' | 'story_mode' = $state('quick_play')
  let quickPlayScores = $state<HighScore[]>([])
  let storyModeScores = $state<HighScore[]>([])

  onMount(() => {
    loadScores()
  })

  function loadScores(): void {
    const userId = $currentUser?.id
    const scores = StorageManager.getHighScores(userId)
    quickPlayScores = scores.quickPlay
    storyModeScores = scores.storyMode
  }

  function resetScores(): void {
    const confirmed = confirm(
      `Are you sure you want to reset ${tab === 'quick_play' ? 'Quick Play' : 'Story Mode'} high scores?`
    )

    if (confirmed) {
      StorageManager.clearHighScores(tab === 'quick_play' ? 'QUICK_PLAY' : 'STORY_MODE')
      loadScores()
    }
  }

  function resetAllScores(): void {
    const confirmed = confirm('Are you sure you want to reset ALL high scores?')

    if (confirmed) {
      StorageManager.clearHighScores()
      loadScores()
    }
  }

  function formatDate(timestamp: number): string {
    const date = new Date(timestamp)
    return date.toLocaleDateString()
  }

  function isCurrentUserScore(scoreName: string): boolean {
    return $currentUser?.username === scoreName
  }

  let currentScores = $derived(tab === 'quick_play' ? quickPlayScores : storyModeScores)

  const modalOptions = $derived(
    currentScores.length > 0
      ? [
          {
            label: 'Reset This Mode',
            value: 'reset_mode',
            onClick: resetScores
          },
          {
            label: 'Reset All Scores',
            value: 'reset_all',
            onClick: resetAllScores
          },
          {
            label: 'Close',
            value: 'close',
            isFirst: true,
            onClick: () => modalManager.close()
          }
        ]
      : [
          {
            label: 'Close',
            value: 'close',
            isFirst: true,
            onClick: () => modalManager.close()
          }
        ]
  )

  function handleSelect(value: string): void {
    console.log(`High score modal option selected: ${value}`)
  }
</script>

<div
  class="high-score-modal w-full min-w-2xl max-w-2xl rounded-xl modal-bg flex flex-col max-h-[85vh]"
>
  <!-- Fixed header section -->
  <div class="modal-header flex-shrink-0 p-6 pb-4">
    <h2 class="title text-2xl uppercase glow-text-2 text-center">Global Leaderboard</h2>
  </div>

  <!-- Scrollable content section -->
  <div class="modal-body flex-1 overflow-y-auto px-6 pb-4 scroll">
    <div class="grid w-full gap-4">
      <div class="tab grid grid-cols-2 w-full gap-4">
        <button
          class={cn(
            'border p-3 font-bold title rounded-xl cursor-pointer hover:opacity-80 transition-all',
            tab === 'quick_play' && 'bg-[#0066cc] border-cyan-400 shadow-lg shadow-cyan-500/50',
            tab !== 'quick_play' && 'bg-black/50 opacity-75 border-cyan-500/30'
          )}
          onclick={() => (tab = 'quick_play')}
        >
          Quick Play
        </button>
        <button
          class={cn(
            'border p-3 font-bold title rounded-xl cursor-pointer hover:opacity-80 transition-all',
            tab === 'story_mode' && 'bg-[#0066cc] border-cyan-400 shadow-lg shadow-cyan-500/50',
            tab !== 'story_mode' && 'bg-black/50 opacity-75 border-cyan-500/30'
          )}
          onclick={() => (tab = 'story_mode')}
        >
          Story Mode
        </button>
      </div>

      <div class="content border p-6 min-h-[200px] rounded-xl bg-black/30">
        {#if currentScores.length === 0}
          <div class="empty-state flex flex-col items-center justify-center h-full min-h-[300px]">
            <div class="text-6xl mb-4 opacity-50">🏆</div>
            <p class="text-xl opacity-70">No high scores yet!</p>
            <p class="text-sm opacity-50 mt-2">Play some games to set records</p>
          </div>
        {:else}
          <div class="scores-table">
            <div
              class="table-header grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 pb-3 border-b-2 border-cyan-500/30 mb-4 font-bold text-sm sticky top-0 bg-black/50 backdrop-blur-sm z-10"
            >
              <div class="text-center">Rank</div>
              <div>Player</div>
              <div class="text-center">Score</div>
              <div class="text-center">Wave</div>
              <div class="text-center">Date</div>
            </div>

            {#each currentScores as score, i (i)}
              <div
                class="score-row grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 py-3 border-b border-cyan-500/10 hover:bg-white/5 transition-colors"
                class:top-score={i === 0}
                class:top-three={i < 3}
                class:current-user={isCurrentUserScore(score.name)}
              >
                <div class="rank text-center">
                  {#if i === 0}
                    <span class="text-2xl">🥇</span>
                  {:else if i === 1}
                    <span class="text-2xl">🥈</span>
                  {:else if i === 2}
                    <span class="text-2xl">🥉</span>
                  {:else}
                    <span
                      class="size-8 border-2 text-sm grid place-content-center font-extrabold rounded-full border-cyan-500/50"
                    >
                      {i + 1}
                    </span>
                  {/if}
                </div>
                <div class="name hud text-xl truncate flex items-center gap-2">
                  {score.name}
                  {#if isCurrentUserScore(score.name)}
                    <span class="text-xs bg-cyan-500/30 px-2 py-1 rounded">YOU</span>
                  {/if}
                </div>
                <div class="score text-center hud text-xl font-bold text-cyan-400">
                  {formatNumberWithCommas(score.score)}
                </div>
                <div class="wave text-center hud text-lg">{score.wave}</div>
                <div class="date text-center text-sm opacity-70">{formatDate(score.date)}</div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Fixed footer section -->
  <div class="modal-footer flex-shrink-0 p-6 pt-4">
    <Options options={modalOptions} layout="horizontal" gap="md" select={handleSelect} />
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

  /* Ensure scrollbar styling */
  .modal-body::-webkit-scrollbar {
    width: 8px;
  }

  .modal-body::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
  }

  .modal-body::-webkit-scrollbar-thumb {
    background: rgba(0, 170, 255, 0.5);
    border-radius: 4px;
  }

  .modal-body::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 170, 255, 0.7);
  }

  .top-score {
    background: linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, transparent 100%);
    border-color: rgba(255, 215, 0, 0.3) !important;
  }

  .top-three {
    font-weight: 600;
  }

  .current-user {
    background: linear-gradient(90deg, rgba(0, 170, 255, 0.15) 0%, transparent 100%);
    border-left: 3px solid rgba(0, 170, 255, 0.8);
  }

  .score-row:hover {
    transform: translateX(4px);
  }

  .empty-state {
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
</style>
