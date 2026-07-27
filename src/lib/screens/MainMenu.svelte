<script lang="ts">
  import Options from '$lib/components/Options.svelte'
  import { navigateTo, toggleExit, toggleHighScore, toggleSettings } from '$lib/stores/gameStore'

  import UserPill from '$lib/components/UserPill.svelte'

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

  function handleMenuSelect(): void {}
</script>

<div
  class="main-menu-screen flex flex-col gap-4 text-center p-6 items-center justify-center h-screen"
>
  <div class="flex flex-col items-center justify-center gap-8 max-w-md">
    <UserPill />
    <h1 class="title text-5xl uppercase glow-text float">Main Menu</h1>

    <Options options={menuOptions} layout="vertical" gap="lg" select={handleMenuSelect} />

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
