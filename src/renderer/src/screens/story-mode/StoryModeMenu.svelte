<script>
  import { navigateTo } from '../../stores/gameStore'
</script>

<div class="flex size-full h-svh flex-col gap-4 text-center p-6 items-center">
  <div
    class="scroll size-full overflow-auto max-h-full grid grid-cols-3 place-content-center place-items-center w-full gap-6 px-5"
  >
    {#each Array(9) as x, i (i)}
      <button
        class="mode md:size-[200px] size-[160px] grid place-content-center place-items-center text-2xl title rounded-md p-4 aspect-square bg-white/10 col-span-1 cursor-pointer hover:opacity-80"
        on:click={() => {
          console.log('screen: ', x)
          navigateTo('STORY_MODE_PLAY')
        }}
      >
        Scene {i + 1}
      </button>
    {/each}
  </div>
</div>

<style>
  button {
    word-spacing: -14px;
    line-height: 110%;
  }
</style>
