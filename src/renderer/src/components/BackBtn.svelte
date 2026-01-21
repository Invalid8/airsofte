<script lang="ts">
  import { goBack } from '../stores/gameStore'
  import { audioManager } from '../utils/AudioManager'

  let {
    onClick,
    position = 'top-left',
    label = 'Back'
  }: {
    onClick?: () => void
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    label?: string
  } = $props()

  function handleClick(): void {
    audioManager.playSound('menuClick')
    if (onClick) {
      onClick()
    } else {
      goBack()
    }
  }

  const positionClasses = {
    'top-left': 'top-6 left-6',
    'top-right': 'top-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-right': 'bottom-6 right-6'
  }
</script>

<button
  class="back-button fixed {positionClasses[position]} z-50"
  onclick={handleClick}
  aria-label={label}
>
  <div class="button-content flex items-center gap-2">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
    <span class="label">{label}</span>
  </div>
</button>

<style>
  .back-button {
    background: linear-gradient(135deg, rgba(0, 102, 204, 0.9) 0%, rgba(0, 170, 255, 0.9) 100%);
    border: 2px solid #00aaff;
    border-radius: 8px;
    color: white;
    padding: 0.75rem 1.25rem;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Press Start 2P', monospace;
    font-size: 0.7rem;
    text-transform: uppercase;
    box-shadow:
      0 0 10px rgba(0, 170, 255, 0.5),
      inset 0 0 20px rgba(255, 255, 255, 0.1);
  }

  .back-button:hover {
    background: linear-gradient(135deg, rgba(0, 120, 230, 0.95) 0%, rgba(0, 200, 255, 0.95) 100%);
    box-shadow:
      0 0 20px rgba(0, 170, 255, 0.8),
      inset 0 0 30px rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  .back-button:active {
    transform: translateY(0);
    box-shadow:
      0 0 10px rgba(0, 170, 255, 0.5),
      inset 0 0 20px rgba(255, 255, 255, 0.1);
  }

  .button-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .label {
    line-height: 1;
  }

  svg {
    flex-shrink: 0;
  }
</style>
