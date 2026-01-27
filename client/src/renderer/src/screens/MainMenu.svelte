<script lang="ts">
  import Options from '../components/Options.svelte'
  import Loader from '../components/Loader.svelte'
  import { replicateLoadFunctions } from '../lib/utils'
  import { navigateTo, toggleExit, toggleHighScore, toggleSettings } from '../stores/gameStore'

  import UserPill from '../components/UserPill.svelte'

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

  function handleMenuSelect(value: string): void {
    console.log(`Menu option selected: ${value}`)
  }
</script>

<div
  class="main-menu-screen flex flex-col gap-4 text-center p-6 items-center justify-center h-screen"
>
  <div class="flex flex-col items-center justify-center gap-8 max-w-md">
    <UserPill />
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

  .main-menu-screen {
    min-height: 100vh;
  }
</style>
