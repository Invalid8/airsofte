<script lang="ts">
  import { fly } from 'svelte/transition'
  import Options from '../components/Options.svelte'
  import Loader from '../components/Loader.svelte'
  import { replicateLoadFunctions } from '../lib/utils'
  import { navigateTo, toggleExit, toggleHighScore, toggleSettings } from '../stores/gameStore'

  const load: boolean = false

  const menuOptions = [
    {
      label: 'Start Game',
      value: 'start',
      isFirst: true,
      onClick: () => navigateTo('GAME_SCREEN')
    },
    {
      label: 'High Score',
      value: 'highscore',
      onClick: () => toggleHighScore()
    },
    {
      label: 'Settings',
      value: 'settings',
      onClick: () => toggleSettings()
    },
    {
      label: 'Exit',
      value: 'exit',
      onClick: () => toggleExit()
    }
  ]

  // Optional additional handler for analytics or other secondary actions
  function handleMenuSelect(value: string): void {
    // You could add analytics tracking here
    console.log(`Menu option selected: ${value}`)

    // Or handle any other side effects not covered by the direct onClick functions
  }
</script>

<div class="flex flex-col gap-4 text-center p-6 items-center" in:fly={{ y: 200, duration: 500 }}>
  <div class="flex flex-col items-center justify-center gap-8 max-w-md">
    <h1 class="title text-5xl uppercase glow-text float">Main Menu</h1>

    <Options options={menuOptions} layout="vertical" gap="lg" select={handleMenuSelect} />

    {#if load}
      <Loader
        steps={replicateLoadFunctions()}
        onComplete={() => {
          console.log('Loading complete')
        }}
        delayBetween={200}
      />
    {/if}
  </div>
</div>

<style>
  h1 {
    word-spacing: -30px;
    line-height: 120%;
  }
</style>
