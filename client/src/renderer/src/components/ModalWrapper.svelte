<script lang="ts">
  import { fly } from 'svelte/transition'
  import { currentModal, modalManager, canCloseModal } from '../utils/ModalManager'
  import PauseModal from '../screens/modals/PauseModal.svelte'
  import SettingsModal from '../screens/modals/SettingsModal.svelte'
  import HighScoreModal from '../screens/modals/HighScoreModal.svelte'
  import HelpModal from '../screens/modals/HelpModal.svelte'
  import ExitModal from '../screens/modals/ExitModal.svelte'

  function handleOverlayClick(): void {
    if ($canCloseModal) {
      modalManager.close()
    }
  }

  function handleModalClick(event: MouseEvent): void {
    event.stopPropagation()
  }
</script>

{#if $currentModal}
  <div class="modal-system fixed inset-0 z-[999] scroll" role="dialog" aria-modal="true">
    <button
      class="overlay fixed inset-0 bg-black/70 cursor-pointer"
      onclick={handleOverlayClick}
      aria-label="Close modal"
    ></button>

    <div
      class="modal-container fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
      in:fly={{ y: 200, duration: 500 }}
      out:fly={{ y: -200, duration: 300 }}
    >
      <div
        class="modal-content pointer-events-auto max-h-[90vh] overflow-auto w-full flex items-center justify-center"
        onclick={handleModalClick}
      >
        {#if $currentModal === 'PAUSE'}
          <PauseModal />
        {:else if $currentModal === 'SETTINGS'}
          <SettingsModal />
        {:else if $currentModal === 'HIGH_SCORE'}
          <HighScoreModal />
        {:else if $currentModal === 'HELP'}
          <HelpModal />
        {:else if $currentModal === 'EXIT'}
          <ExitModal />
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-system {
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .overlay {
    border: none;
    padding: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
  }

  .overlay:focus {
    outline: none;
  }
</style>
