<script>
  import { fly } from 'svelte/transition'
  import Button from '../../components/Button.svelte'
  import { toggleSettings } from '../../stores/gameStore'
</script>

<div class="overlay fixed size-full top-0 left-0 right-0 bottom 0 bg-black/70 z-[999]"></div>

<div
  class="settings--modal fixed w-full max-w-md rounded-xl bg-white/10 space-1-bg p-6 pt-8 z-[999] top-1/2 left-1/2 -translate-1/2"
  in:fly={{ y: 200, duration: 500 }}
>
  <div class="content flex flex-col items-center justify-center gap-4">
    <h2 class="title text-2xl uppercase glow-text-2">Settings</h2>

    <div class="options">
      <ul class="grid">
        <li>
          <Button
            label="Close"
            onClick={() => {
              toggleSettings()
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
