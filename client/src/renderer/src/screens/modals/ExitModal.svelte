<script lang="ts">
  import Options from '../../components/Options.svelte'
  import { modalManager } from '../../utils/ModalManager'
  import { exitGame } from '../../stores/gameStore'

  const exitOptions = [
    {
      label: 'Cancel',
      value: 'cancel',
      isFirst: true,
      onClick: () => {
        modalManager.close()
      }
    },
    {
      label: 'Exit',
      value: 'exit',
      onClick: () => {
        exitGame()
      }
    }
  ]

  function handleSelect(value: string): void {
    console.log(`Exit modal option selected: ${value}`)
  }
</script>

<div class="exit-modal w-full max-w-md rounded-xl modal-bg p-6 pt-8 lg:px-16 lg:py-12">
  <div class="content flex flex-col items-center justify-center gap-3">
    <h2 class="title text-2xl uppercase glow-text-2">Exit Game</h2>
    <p class="message text-center text-lg mb-2">Are you sure you want to exit?</p>

    <Options options={exitOptions} layout="horizontal" gap="md" select={handleSelect} />
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
