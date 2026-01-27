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
  class="back-button fixed z-50 {positionClasses[position]}"
  on:click={handleClick}
  aria-label={label}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>

  <span class="">{label}</span>
</button>

<style>
  .back-button {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;

    padding: 0.65rem 0.75rem;
    padding-right: 1.15rem;
    border-radius: 8px;
    border: 2px solid #00aaff;

    background: linear-gradient(
      135deg,
      rgba(2, 90, 179, 0.95),
      rgba(3, 129, 175, 0.95)
    );

    color: #ffffff;
    font-family: 'Press Start 2P', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;

    cursor: pointer;
    user-select: none;

    box-shadow:
      0 0 8px rgba(0, 170, 255, 0.6),
      inset 0 0 14px rgba(255, 255, 255, 0.12);

    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease,
      background 0.15s ease;
  }

  .back-button:hover {
    transform: translateY(-1px);
    box-shadow:
      0 0 16px rgba(0, 170, 255, 0.85),
      inset 0 0 20px rgba(255, 255, 255, 0.2);
  }

  .back-button:active {
    transform: translateY(0);
    box-shadow:
      0 0 8px rgba(0, 170, 255, 0.6),
      inset 0 0 14px rgba(255, 255, 255, 0.12);
  }

  .back-button:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 3px rgba(0, 170, 255, 0.45),
      0 0 16px rgba(0, 170, 255, 0.9);
  }

  .label {
    line-height: 1;
    white-space: nowrap;
  }

  svg {
    flex-shrink: 0;
  }
</style>

