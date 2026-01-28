<script lang="ts">
  import { gameState, toggleSound } from './stores/gameStore'
  import { currentUser } from './utils/userManager'
  import { audioManager } from './utils/AudioManager'
  import StartupScreen from './screens/StartupScreen.svelte'
  import UserSelectionScreen from './screens/UserSelectionScreen.svelte'
  import MainMenu from './screens/MainMenu.svelte'
  import GameScreen from './screens/GameScreen.svelte'
  import GameOverScreen from './screens/GameOverScreen.svelte'
  import DebugTools from './screens/DebugTools.svelte'
  import QuickPlay from './screens/QuickPlay.svelte'
  import StoryModeMenu from './screens/story-mode/StoryModeMenu.svelte'
  import StoryModePlay from './screens/story-mode/StoryModePlay.svelte'
  import ModalWrapper from './components/ModalWrapper.svelte'
  import { onDestroy, onMount } from 'svelte'
  import GamePadIndicator from './components/GamePadIndicator.svelte'
  import UserPill from './components/UserPill.svelte'
  import GeminiMissionCreator from './screens/GeminiMissionCreator.svelte'

  let audioInitialized = false
  let showUserSelection = $derived(!$currentUser && $gameState.route !== 'STARTUP')

  function initializeAudio(): void {
    if (!audioInitialized) {
      audioManager.playMusic('background')
      audioInitialized = true
    }
  }

  onMount(async () => {
    document.addEventListener('click', initializeAudio, { once: true })
    document.addEventListener('keydown', initializeAudio, { once: true })
  })

  onDestroy(() => {
    audioManager.stopAll()
    document.removeEventListener('click', initializeAudio)
    document.removeEventListener('keydown', initializeAudio)
  })
</script>

<main class={$gameState.theme === 'Dark' ? 'dark-theme' : 'light-theme'}>
  {#if showUserSelection}
    <UserSelectionScreen />
  {:else if $gameState.route === 'STARTUP'}
    <StartupScreen />
  {:else if $gameState.route === 'MAIN_MENU'}
    <UserPill />
    <MainMenu />
  {:else if $gameState.route === 'GAME_SCREEN'}
    <UserPill />
    <GameScreen />
  {:else if $gameState.route === 'QUICK_PLAY'}
    <QuickPlay />
  {:else if $gameState.route === 'AI_MISSIONS'}
    <GeminiMissionCreator />
  {:else if $gameState.route === 'STORY_MODE_MENU'}
    <StoryModeMenu />
  {:else if $gameState.route === 'STORY_MODE_PLAY'}
    <StoryModePlay />
  {:else if $gameState.route === 'GAME_OVER'}
    <GameOverScreen />
  {:else if $gameState.route === 'DEBUG'}
    <DebugTools />
  {/if}

  <ModalWrapper />
  <GamePadIndicator />

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
  .sound-toggle {
    position: absolute;
    bottom: 30px;
    left: 30px;
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    padding: 0;
    z-index: 1000;
  }

  .sound-toggle svg {
    width: 24px;
    height: 24px;
  }
</style>
