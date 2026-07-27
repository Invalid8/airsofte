<script lang="ts">
  import { fly } from 'svelte/transition'
  import { currentModal, modalManager, canCloseModal } from '$lib/utils/ModalManager'
  import PauseModal from '$lib/screens/modals/PauseModal.svelte'
  import SettingsModal from '$lib/screens/modals/SettingsModal.svelte'
  import HighScoreModal from '$lib/screens/modals/HighScoreModal.svelte'
  import HelpModal from '$lib/screens/modals/HelpModal.svelte'
  import ExitModal from '$lib/screens/modals/ExitModal.svelte'

  function handleOverlayClick(): void {
    if ($canCloseModal) {
      modalManager.close()
    }
  }

</script>

{#if $currentModal}
  <div class="modal-system fixed inset-0 z-[999]" role="dialog" aria-modal="true">
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
        class="modal-content pointer-events-auto max-h-[90vh] overflow-auto"
        role="document"
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
