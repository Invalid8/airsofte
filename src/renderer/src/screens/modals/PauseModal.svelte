<script lang="ts">
  import Button from '../../components/Button.svelte'
  import { togglePause, navigateTo } from '../../stores/gameStore'
  import { modalManager } from '../../utils/ModalManager'

  function handleResume(): void {
    togglePause()
  }

  function handleHelp(): void {
    modalManager.open('HELP')
  }

  function handleSettings(): void {
    modalManager.open('SETTINGS')
  }

  function handleMainMenu(): void {
    modalManager.close()
    navigateTo('MAIN_MENU')
  }
</script>

<div class="pause-menu-modal w-full max-w-md rounded-xl modal-bg p-6 pt-8 min-w-md">
  <div class="content flex flex-col items-center justify-center gap-4">
    <h2 class="title text-2xl uppercase glow-text-2">Paused</h2>

    <div class="options">
      <ul class="grid gap-1 justify-center items-center">
        <li class="mx-auto">
          <Button label="Resume" onClick={handleResume} isFirst={true} />
        </li>
        <li class="mx-auto">
          <Button label="Settings" onClick={handleSettings} />
        </li>
        <li class="mx-auto">
          <Button label="Help" onClick={handleHelp} />
        </li>
        <li class="mx-auto">
          <Button label="Main Menu" onClick={handleMainMenu} />
        </li>
      </ul>
    </div>

    <div class="pause-info text-center text-sm opacity-70 mt-4">
      <p><span class="mr-2">Press </span><kbd class="key">ESC</kbd> <span class="ml-2">to resume</span></p>
    </div>
  </div>
</div>

<style>
  h2 {
    word-spacing: -10px;
    line-height: 115%;
  }

  .modal-bg {
    background: linear-gradient(
      135deg,
      rgba(5, 15, 40, 0.98) 0%,
      rgba(10, 25, 65, 0.98) 50%,
      rgba(5, 15, 40, 0.98) 100%
    );
    border: 2px solid rgba(0, 170, 255, 0.6);
    box-shadow:
      0 0 40px rgba(0, 170, 255, 0.4),
      inset 0 0 60px rgba(0, 100, 200, 0.1);
  }

  .key {
    display: inline-block;
    padding: 0.2rem 0.5rem;
    background: rgba(0, 0, 0, 0.7);
    border: 2px solid #00aaff;
    border-radius: 0.25rem;
    /* font-family: 'VT323', monospace; */
    font-size: 1rem;
    color: #00aaff;
  }
</style>
