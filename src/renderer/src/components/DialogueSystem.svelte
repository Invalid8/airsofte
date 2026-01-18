<script lang="ts">
  import { fade, fly } from 'svelte/transition'
  import { onMount, onDestroy } from 'svelte'
  import { gameEvents } from '../lib/eventBus'
  import type { StoryMission } from '../types/gameTypes'

  let {
    mission
  }: {
    mission: StoryMission
  } = $props()

  let showDialogue = $state(false)
  let currentDialogue = $state<{ character: string; text: string } | null>(null)
  let dialogueQueue = $state<Array<{ character: string; text: string }>>([])

  function showDialogueByTiming(timing: 'START' | 'MID' | 'END'): void {
    const dialogues = mission.dialogue?.filter((d) => d.timing === timing) || []

    if (dialogues.length > 0) {
      dialogueQueue = [...dialogues]
      showNextDialogue()
    }
  }

  function showNextDialogue(): void {
    if (dialogueQueue.length === 0) {
      hideDialogue()
      return
    }

    currentDialogue = dialogueQueue[0]
    dialogueQueue = dialogueQueue.slice(1)
    showDialogue = true

    setTimeout(() => {
      if (dialogueQueue.length > 0) {
        showNextDialogue()
      } else {
        hideDialogue()
      }
    }, 4000)
  }

  function hideDialogue(): void {
    showDialogue = false
    currentDialogue = null
  }

  function skipDialogue(): void {
    dialogueQueue = []
    hideDialogue()
  }

  onMount(() => {
    const unsubGameStart = gameEvents.on('GAME_START', () => {
      showDialogueByTiming('START')
    })

    const unsubWaveComplete = gameEvents.on('WAVE_COMPLETE', (event) => {
      if (event.data.wave === Math.floor(mission.waves.length / 2)) {
        showDialogueByTiming('MID')
      }
    })

    const unsubMissionComplete = gameEvents.on('MISSION_COMPLETE', () => {
      showDialogueByTiming('END')
    })

    return () => {
      unsubGameStart()
      unsubWaveComplete()
      unsubMissionComplete()
    }
  })

  onDestroy(() => {
    hideDialogue()
  })
</script>

{#if showDialogue && currentDialogue}
  <div
    class="dialogue-container fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-full max-w-2xl px-8"
    in:fly={{ y: 50, duration: 300 }}
    out:fade={{ duration: 200 }}
  >
    <div
      class="dialogue-box bg-black/90 border-2 border-cyan-500 rounded-lg p-6 shadow-lg shadow-cyan-500/50"
    >
      <div class="character-name text-xl font-bold text-cyan-400 mb-2 title">
        {currentDialogue.character}
      </div>
      <div class="dialogue-text text-lg leading-relaxed">
        {currentDialogue.text}
      </div>
      <button
        class="skip-btn absolute top-2 right-2 text-sm opacity-70 hover:opacity-100 transition-opacity"
        onclick={skipDialogue}
      >
        [SKIP]
      </button>
    </div>
  </div>
{/if}

<style>
  .dialogue-box {
    position: relative;
    animation: pulse-border 2s ease-in-out infinite;
  }

  @keyframes pulse-border {
    0%,
    100% {
      border-color: rgba(0, 170, 255, 1);
      box-shadow: 0 0 20px rgba(0, 170, 255, 0.5);
    }
    50% {
      border-color: rgba(0, 170, 255, 0.7);
      box-shadow: 0 0 30px rgba(0, 170, 255, 0.7);
    }
  }

  .skip-btn {
    background: none;
    border: none;
    color: #00aaff;
    cursor: pointer;
    font-family: 'VT323', monospace;
  }

  .dialogue-text {
    font-family: 'Orbitron', sans-serif;
  }
</style>
