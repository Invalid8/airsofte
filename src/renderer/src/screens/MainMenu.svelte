<script lang="ts">
  import { fly } from 'svelte/transition'
  import Options from '../components/Options.svelte'
  import Loader from '../components/Loader.svelte'
  import { replicateLoadFunctions } from '../lib/utils'
  import { navigateTo, toggleExit, toggleHighScore, toggleSettings } from '../stores/gameStore'
  import { currentUser, userManager } from '../utils/userManager'
  import { audioManager } from '../utils/AudioManager'

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

  function handleSwitchUser(): void {
    audioManager.playSound('menuClick')
    userManager.logout()
  }
</script>

<div class="flex flex-col gap-4 text-center p-6 items-center" in:fly={{ y: 200, duration: 500 }}>
  <div class="flex flex-col items-center justify-center gap-8 max-w-md">
    {#if $currentUser}
      <div class="user-info-card w-full bg-black/70 border-2 border-cyan-500 rounded-lg p-4 mb-4">
        <div class="flex items-center gap-3 mb-3">
          <div
            class="avatar size-14 rounded-full bg-cyan-500/30 border-2 border-cyan-500 flex items-center justify-center text-2xl"
          >
            {$currentUser.username.charAt(0).toUpperCase()}
          </div>
          <div class="flex-1 text-left">
            <div class="username text-xl font-bold">{$currentUser.username}</div>
            <div class="stats-line text-sm opacity-70">
              {$currentUser.stats.gamesPlayed} games • {$currentUser.stats.totalScore.toLocaleString()}
              total score
            </div>
          </div>
        </div>
        <button
          class="switch-user-btn w-full py-2 px-4 bg-black/50 border border-cyan-500/50 rounded hover:bg-cyan-500/20 hover:border-cyan-500 transition-all text-sm"
          onclick={handleSwitchUser}
        >
          Switch User
        </button>
      </div>
    {/if}

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

  .switch-user-btn {
    font-family: 'Orbitron', sans-serif;
  }
</style>
