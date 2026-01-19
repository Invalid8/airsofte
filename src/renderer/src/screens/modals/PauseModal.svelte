<script lang="ts">
  import { fly } from 'svelte/transition'
  import Button from '../../components/Button.svelte'
  import { togglePause, navigateTo } from '../../stores/gameStore'

  function handleMainMenu(): void {
    togglePause()
    navigateTo('MAIN_MENU')
  }
</script>

<div class="overlay fixed size-full top-0 left-0 right-0 bottom-0 bg-black/70 z-[999]"></div>

<div
  class="pause-menu--modal fixed w-full max-w-md rounded-xl modal-bg p-6 pt-8 z-[999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
  in:fly={{ y: 200, duration: 500 }}
>
  <div class="content flex flex-col items-center justify-center gap-4">
    <h2 class="title text-2xl uppercase glow-text-2">Paused</h2>

    <div class="options">
      <ul class="grid">
        <li>
          <Button label="Resume" onClick={togglePause} isFirst={true} />
        </li>
        <li>
          <Button label="Main Menu" onClick={handleMainMenu} />
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

  .modal-bg {
    background: linear-gradient(135deg, rgba(0, 10, 30, 0.95) 0%, rgba(0, 30, 60, 0.95) 100%);
    border: 2px solid rgba(0, 170, 255, 0.5);
    box-shadow: 0 0 40px rgba(0, 170, 255, 0.3);
    backdrop-filter: blur(10px);
  }
</style>
