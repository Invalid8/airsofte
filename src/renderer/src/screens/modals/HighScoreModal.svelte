<script lang="ts">
  import { fly } from 'svelte/transition'
  import Button from '../../components/Button.svelte'
  import { toggleHighScore } from '../../stores/gameStore'
  import { cn } from '../../lib/utils'

  let tab: 'quick_play' | 'story_mode' = 'quick_play'
</script>

<div class="overlay fixed size-full top-0 left-0 right-0 bottom 0 bg-black/70 z-[999]"></div>

<div
  class="high-score--modal fixed w-full max-w-2xl rounded-xl bg-white/10 space-1-bg p-6 pt-8 z-[999] top-1/2 left-1/2 -translate-1/2"
  in:fly={{ y: 200, duration: 500 }}
>
  <div class="content flex flex-col items-center justify-center gap-4">
    <h2 class="title text-2xl uppercase glow-text-2">High Score</h2>

    <div class="grid w-full gap-4">
      <div class="tab grid grid-cols-2 w-full gap-4">
        <button
          class={cn(
            'border p-3 font-bold title rounded-xl cursor-pointer hover:opacity-80',
            tab === 'quick_play' && 'bg-[#0066cc]',
            tab !== 'quick_play' && 'bg-black opacity-75'
          )}
          on:click={() => {
            tab = 'quick_play'
          }}>Quick Play</button
        >
        <button
          class={cn(
            'border p-3 font-bold title rounded-xl cursor-pointer hover:opacity-80',
            tab === 'story_mode' && 'bg-[#0066cc]',
            tab !== 'story_mode' && 'bg-black opacity-75'
          )}
          on:click={() => {
            tab = 'story_mode'
          }}>Story Mode</button
        >
      </div>
      <div
        class="content border p-6 min-h-30 rounded-xl bg-white/2 max-h-[calc(100svh_-_440px)] overflow-auto scroll"
      >
        <ul class="grid grid-cols-3 max-[450px]:grid-cols-2 gap-10 gap-y-5">
          {#if tab == 'quick_play'}
            {#each Array(20) as a, i (`${i}-${a}`)}
              <li
                class="flex items-center gap-2 justify-between max-w-[180px] border-b-2 pb-2 border-dashed border-[#0066cc]"
              >
                <div class="flex items-center gap-3">
                  <span
                    class="size-8 border-3 text-sm grid place-content-center font-extrabold rounded-full border-[#0066cc] bg-black text-white"
                    >{i + 1}</span
                  >
                  <span class="hud text-xl">Billy</span>
                </div>
                <span class="score">1000</span>
              </li>
            {/each}
          {:else}
            {#each Array(20) as a, i (`${i}-${a}`)}
              <li
                class="flex items-center gap-2 justify-between max-w-[180px] border-b-2 pb-2 border-dashed border-[#0066cc]"
              >
                <div class="flex items-center gap-3">
                  <span
                    class="size-8 border-3 text-sm grid place-content-center font-extrabold rounded-full border-[#0066cc] bg-black text-white"
                    >{i + 1}</span
                  >
                  <span class="hud text-xl">Mark</span>
                </div>
                <span class="score">2000</span>
              </li>
            {/each}
          {/if}
        </ul>
      </div>
    </div>

    <div class="options">
      <ul class="grid text-center gap-1">
        <li>
          <Button
            label="Reset Scores"
            onClick={() => {
              toggleHighScore()
            }}
          />
        </li>
        <li>
          <Button
            label="Close"
            onClick={() => {
              toggleHighScore()
            }}
          />
        </li>
      </ul>
    </div>
  </div>
</div>

<style>
  h2 {
    word-spacing: -10px;
    line-height: 115%;
  }
</style>
