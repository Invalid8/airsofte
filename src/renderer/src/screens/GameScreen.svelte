<script lang="ts">
  import { fly } from 'svelte/transition'
  import Button from '../components/Button.svelte'
  import Loader from '../components/Loader.svelte'
  import { replicateLoadFunctions } from '../lib/utils'
  import { goBack, navigateTo, toggleHelp } from '../stores/gameStore'
  import PlayerShip from '../assets/sprites/player-ship-i.png'

  let load: boolean = false

  let loadFunction: () => void

  const menuOptions = [
    {
      label: 'Quick Play',
      value: 'quick-game',
      isFirst: true,
      onClick: () => navigateTo('GAME_SCREEN')
    },
    {
      label: 'Story Mode',
      value: 'story-mode',
      onClick: () => navigateTo('STORY_MODE_MENU')
    },
    {
      label: 'Settings',
      value: 'settings',
      onClick: () => toggleHelp()
    },
    {
      label: 'Exit',
      value: 'exit',
      onClick: () => goBack()
    }
  ]
</script>

<div class="flex flex-col gap-4 text-center p-6 items-center" in:fly={{ y: 200, duration: 500 }}>
  <div class="flex flex-col items-center justify-center gap-8 max-w-md">
    {#if !load}
      <h1 class="title text-5xl uppercase glow-text float">Game Play</h1>
    {/if}

    {#if !load}
      <div class="options">
        <ul class="grid">
          <li>
            <Button
              label="Quick Game"
              onClick={() => {
                load = true
                loadFunction = () => navigateTo('QUICK_PLAY')
              }}
            />
          </li>
          <li>
            <Button
              label="Story Mode"
              onClick={() => {
                load = true
                loadFunction = () => navigateTo('STORY_MODE_MENU')
              }}
            />
          </li>
          <li>
            <Button
              label="Help Me"
              onClick={() => {
                toggleHelp()
              }}
            />
          </li>
          <li>
            <Button label="Back" onClick={goBack} />
          </li>
        </ul>
      </div>
    {/if}

    {#if load}
      <img class="ship float mx-auto my-4" width="350" src={PlayerShip} alt="Player Ship" />
    {/if}

    {#if load}
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
