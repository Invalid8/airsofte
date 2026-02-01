<script lang="ts">
  import { fly } from 'svelte/transition'
  import Options from '../components/Options.svelte'
  import Loader from '../components/Loader.svelte'
  import { replicateLoadFunctions } from '../lib/utils'
  import { navigateTo, toggleHelp } from '../stores/gameStore'
  import PlayerShip from '../assets/sprites/player-ship-i.png'

  let load = $state(false)
  let loadFunction: (() => void) | null = $state(null)

  const gameOptions = [
    {
      label: 'Quick Game',
      value: 'quick_play',
      isFirst: true,
      onClick: () => {
        load = true
        loadFunction = () => navigateTo('QUICK_PLAY')
      }
    },
    {
      label: 'Story Mode',
      value: 'story_mode',
      onClick: () => {
        load = true
        loadFunction = () => navigateTo('STORY_MODE_MENU')
      }
    },
    {
      label: 'AI Missions',
      value: 'ai_missions',
      onClick: () => {
        load = true
        loadFunction = () => navigateTo('AI_MISSIONS')
      }
    },
    {
      label: 'Help Me',
      value: 'help',
      onClick: () => {
        toggleHelp()
      }
    },
    {
      label: 'Back',
      value: 'back',
      onClick: () => {
        navigateTo('MAIN_MENU')
      }
    }
  ]

  function handleMenuSelect(value: string): void {
    console.log(`Menu option selected: ${value}`)
  }
</script>

<div class="flex flex-col gap-4 text-center p-6 items-center" in:fly={{ y: 200, duration: 500 }}>
  <div class="flex flex-col items-center justify-center gap-8 max-w-md">
    {#if !load}
      <h1 class="title text-5xl uppercase glow-text float">Game Play</h1>
    {/if}

    {#if !load}
      <Options options={gameOptions} layout="vertical" gap="md" select={handleMenuSelect} />
    {/if}

    {#if load}
      <img class="ship float mx-auto my-4" width="350" src={PlayerShip} alt="Player Ship" />
    {/if}

    {#if load && loadFunction}
      <Loader steps={replicateLoadFunctions()} onComplete={loadFunction} delayBetween={200} />
    {/if}
  </div>
</div>

<style>
  h1 {
    word-spacing: -30px;
    line-height: 120%;
  }
</style>
