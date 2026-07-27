<script lang="ts">
  import { fly } from 'svelte/transition'
  import Logo from '$lib/assets/logo.png'
  import Loader from '$lib/components/Loader.svelte'
  import { replicateLoadFunctions } from '$lib/game/utils'
  import { navigateTo } from '$lib/stores/gameStore'
  import { onMount } from 'svelte'
  import { audioManager } from '$lib/utils/AudioManager'
  import Spaceship from '$lib/components/SpaceshipX.svelte'

  let isComplete = false

  function handleComplete(): void {
    isComplete = true

    setTimeout(() => {
      navigateTo('MAIN_MENU')
    }, 200)
  }

  onMount(() => {
    audioManager.playSound('flyOver')
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
