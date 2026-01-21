<script lang="ts">
  import Button from '../../components/Button.svelte'
  import { modalManager } from '../../utils/ModalManager'
  import { exitGame } from '../../stores/gameStore'
</script>

<div class="exit-modal w-full max-w-md rounded-xl modal-bg p-6 pt-8">
  <div class="content flex flex-col items-center justify-center gap-4">
    <h2 class="title text-2xl uppercase glow-text-2">Exit Game</h2>
    <p class="message text-center text-lg">Are you sure you want to exit?</p>

    <div class="options flex gap-4 mt-2">
      <Button label="Cancel" onClick={() => modalManager.close()} isFirst={true} />
      <Button
        label="Exit"
        onClick={() => {
          exitGame()
        }}
      />
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

  .message {
    color: #fff;
    opacity: 0.9;
  }
</style>
