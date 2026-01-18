<script lang="ts">
  import { gameState, toggleSound } from './stores/gameStore'
  import StartupScreen from './screens/StartupScreen.svelte'
  import MainMenu from './screens/MainMenu.svelte'
  import GameScreen from './screens/GameScreen.svelte'
  import PauseMenu from './screens/modals/PauseModal.svelte'
  import GameOverScreen from './screens/GameOverScreen.svelte'
  import SettingsModal from './screens/modals/SettingsModal.svelte'
  import HighScoreModal from './screens/modals/HighScoreModal.svelte'
  import DebugTools from './screens/DebugTools.svelte'
  import QuickPlay from './screens/QuickPlay.svelte'
  import HelpModal from './screens/modals/HelpModal.svelte'
  import StoryModeMenu from './screens/story-mode/StoryModeMenu.svelte'
  import StoryModePlay from './screens/story-mode/StoryModePlay.svelte'
  import ExitModal from './screens/modals/ExitModal.svelte'
  import { BgSound1 } from './lib/sounds'
  import { onDestroy, onMount } from 'svelte'

  const bgSound1 = BgSound1()

  $effect(() => {
    if (['STARTUP', 'QUICK_PLAY', 'STORY_MODE_PLAY'].includes($gameState.route)) {
      // bgSound1.fade(4, 7, 2)
      bgSound1.pause()
    }
  })

  onMount(() => {
    bgSound1.play()
  })

  onDestroy(() => {
    bgSound1.unload()
  })
</script>

<main class={$gameState.theme === 'Dark' ? 'dark-theme' : 'light-theme'}>
  {#if $gameState.route === 'STARTUP'}
    <StartupScreen />
  {:else if $gameState.route === 'MAIN_MENU'}
    <MainMenu />
  {:else if $gameState.route === 'GAME_SCREEN'}
    <GameScreen />
  {:else if $gameState.route === 'QUICK_PLAY'}
    <QuickPlay />
  {:else if $gameState.route === 'STORY_MODE_MENU'}
    <StoryModeMenu />
  {:else if $gameState.route === 'STORY_MODE_PLAY'}
    <StoryModePlay />
  {:else if $gameState.route === 'GAME_OVER'}
    <GameOverScreen />
  {:else if $gameState.route === 'DEBUG'}
    <DebugTools />
  {/if}

  {#if $gameState.isPaused}
    <PauseMenu />
  {/if}

  {#if $gameState.showSettings}
    <SettingsModal />
  {/if}

  {#if $gameState.showHighScore}
    <HighScoreModal />
  {/if}

  {#if $gameState.showHelp}
    <HelpModal />
  {/if}

  {#if $gameState.showExit}
    <ExitModal />
  {/if}

  <div class="sound">
    <button class="sound-toggle" onclick={toggleSound}>
      {#if $gameState.sound}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-volume2-icon lucide-volume-2"
          ><path
            d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"
          /><path d="M16 9a5 5 0 0 1 0 6" /><path d="M19.364 18.364a9 9 0 0 0 0-12.728" /></svg
        >
      {:else}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-volume-off-icon lucide-volume-off"
          ><path d="M16 9a5 5 0 0 1 .95 2.293" /><path
            d="M19.364 5.636a9 9 0 0 1 1.889 9.96"
          /><path d="m2 2 20 20" /><path
            d="m7 7-.587.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298V11"
          /><path d="M9.828 4.172A.686.686 0 0 1 11 4.657v.686" /></svg
        >
      {/if}
    </button>
  </div>
</main>

<style>
  /* main {
    width: 100%;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background-color 0.3s ease;
  }

  :global(.dark-theme) {
    background-color: #121212;
    color: #ffffff;
  }

  :global(.light-theme) {
    background-color: #f0f0f0;
    color: #121212;
  } */

  .sound-toggle {
    position: absolute;
    top: 30px;
    right: 30px;
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    padding: 0;
  }

  .sound-toggle svg {
    width: 24px;
    height: 24px;
  }
</style>
