<script lang="ts">
  import { fly } from 'svelte/transition'
  import Logo from '../assets/logo.png'
  import Loader from '../components/Loader.svelte'
  import Spaceship from '../components/Spaceship.svelte'
  import { replicateLoadFunctions } from '../lib/utils'
  import { navigateTo } from '../stores/gameStore'
  import soundManager from '../lib/soundManager'
  import { onMount } from 'svelte'

  let isComplete = false

  function handleComplete(): void {
    isComplete = true

    setTimeout(() => {
      navigateTo('MAIN_MENU')
    }, 200)
  }

  onMount(() => {
    soundManager.playSound('flyOver')
  })
</script>

{#if !isComplete}
  <div
    class="flex flex-col gap-4 text-center p-6 items-center"
    out:fly={{ y: -200, duration: 600 }}
  >
    <Spaceship />
    <div class="flex flex-col items-center justify-center gap-5 max-w-md">
      <img src={Logo} alt="AIRSOFTE" class="title text-5xl object-fill object-center" />
      <p class="subtitle text-base font-bold tracking-wider title">
        Take to the skies and dominate the battlefield!
      </p>
      <Loader steps={replicateLoadFunctions()} onComplete={handleComplete} delayBetween={200} />
    </div>
    <Spaceship opp />
  </div>
{/if}
