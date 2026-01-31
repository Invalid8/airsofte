<script lang="ts">
  import { onMount } from 'svelte'
  import { audioManager } from '../utils/AudioManager'

  let {
    value = $bindable(''),
    onSubmit,
    onCancel,
    maxLength = 20
  }: {
    value?: string
    onSubmit: (text: string) => void
    onCancel?: () => void
    maxLength?: number
  } = $props()

  const keyboard = [
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
    ['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'],
    ['U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3'],
    ['4', '5', '6', '7', '8', '9', ' ', '←', '✓', '✗']
  ]

  let currentRow = $state(0)
  let currentCol = $state(0)

  function handleKeyPress(key: string): void {
    audioManager.playSound('menuClick')

    if (key === '←') {
      // Backspace
      value = value.slice(0, -1)
    } else if (key === '✓') {
      // Submit
      if (value.trim().length > 0) {
        onSubmit(value.trim())
      }
    } else if (key === '✗') {
      // Cancel
      if (onCancel) {
        onCancel()
      }
    } else if (value.length < maxLength) {
      // Add character
      value += key
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      if (onCancel) onCancel()
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const key = keyboard[currentRow][currentCol]
      handleKeyPress(key)
      return
    }

    if (event.key === ' ') {
      event.preventDefault()
      const key = keyboard[currentRow][currentCol]
      handleKeyPress(key)
      return
    }

    // Navigation
    let moved = false

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      currentRow = (currentRow - 1 + keyboard.length) % keyboard.length
      moved = true
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      currentRow = (currentRow + 1) % keyboard.length
      moved = true
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      currentCol = (currentCol - 1 + keyboard[currentRow].length) % keyboard[currentRow].length
      moved = true
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      currentCol = (currentCol + 1) % keyboard[currentRow].length
      moved = true
    }

    // Ensure column is valid for current row
    if (moved) {
      if (currentCol >= keyboard[currentRow].length) {
        currentCol = keyboard[currentRow].length - 1
      }
      audioManager.playSound('menuClick', 0.2)
    }

    // Allow typing directly
    if (event.key.length === 1 && value.length < maxLength) {
      const char = event.key.toUpperCase()
      if (/[A-Z0-9 ]/.test(char)) {
        value += char
        audioManager.playSound('menuClick')
      }
    }

    if (event.key === 'Backspace') {
      event.preventDefault()
      value = value.slice(0, -1)
      audioManager.playSound('menuClick')
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  })
</script>

<div class="virtual-keyboard">
  <div class="keyboard-header">
    <div class="input-display">
      <div class="input-label">Enter Name:</div>
      <div class="input-value">
        {value || '_'}
        <span class="cursor">|</span>
      </div>
      <div class="input-hint">{value.length}/{maxLength}</div>
    </div>
  </div>

  <div class="keyboard-grid">
    {#each keyboard as row, rowIndex (rowIndex)}
      <div class="keyboard-row">
        {#each row as key, colIndex (rowIndex + '-' + colIndex)}
          <button
            class="keyboard-key"
            class:active={currentRow === rowIndex && currentCol === colIndex}
            class:special={['←', '✓', '✗'].includes(key)}
            class:submit={key === '✓'}
            class:cancel={key === '✗'}
            onclick={() => handleKeyPress(key)}
          >
            {key}
          </button>
        {/each}
      </div>
    {/each}
  </div>

  <div class="keyboard-footer">
    <div class="controls-hint">
      <span>Arrow Keys: Navigate</span>
      <span>Enter/Space: Select</span>
      <span>Esc: Cancel</span>
    </div>
  </div>
</div>

<style>
  .virtual-keyboard {
    background: rgba(0, 0, 0, 0.95);
    border: 2px solid rgba(0, 170, 255, 0.5);
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 0 40px rgba(0, 170, 255, 0.3);
    max-width: 800px;
    margin: 0 auto;
  }

  .keyboard-header {
    margin-bottom: 2rem;
  }

  .input-display {
    background: rgba(0, 0, 0, 0.7);
    border: 2px solid rgba(0, 170, 255, 0.3);
    border-radius: 0.5rem;
    padding: 1.5rem;
    text-align: center;
  }

  .input-label {
    font-size: 0.875rem;
    opacity: 0.7;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
  }

  .input-value {
    font-size: 2rem;
    font-family: 'Press Start 2P', monospace;
    color: #00aaff;
    text-shadow: 0 0 10px rgba(0, 170, 255, 0.8);
    min-height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
  }

  .cursor {
    animation: blink 1s infinite;
  }

  @keyframes blink {
    0%,
    50% {
      opacity: 1;
    }
    51%,
    100% {
      opacity: 0;
    }
  }

  .input-hint {
    font-size: 0.75rem;
    opacity: 0.6;
    margin-top: 0.5rem;
  }

  .keyboard-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .keyboard-row {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }

  .keyboard-key {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, rgba(2, 90, 179, 0.5), rgba(3, 129, 175, 0.5));
    border: 2px solid rgba(0, 170, 255, 0.4);
    border-radius: 0.5rem;
    color: white;
    font-size: 1.25rem;
    font-family: 'Press Start 2P', monospace;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .keyboard-key:hover {
    background: linear-gradient(135deg, rgba(2, 90, 179, 0.7), rgba(3, 129, 175, 0.7));
    border-color: rgba(0, 170, 255, 0.6);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 170, 255, 0.4);
  }

  .keyboard-key.active {
    background: linear-gradient(135deg, rgba(0, 170, 255, 0.9), rgba(0, 255, 170, 0.9));
    border-color: rgba(0, 255, 170, 1);
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(0, 170, 255, 0.8);
  }

  .keyboard-key.special {
    width: 80px;
    font-size: 1.5rem;
  }

  .keyboard-key.submit {
    background: linear-gradient(135deg, rgba(0, 200, 100, 0.5), rgba(0, 255, 136, 0.5));
    border-color: rgba(0, 255, 136, 0.6);
  }

  .keyboard-key.submit:hover {
    background: linear-gradient(135deg, rgba(0, 200, 100, 0.7), rgba(0, 255, 136, 0.7));
  }

  .keyboard-key.cancel {
    background: linear-gradient(135deg, rgba(200, 0, 0, 0.5), rgba(255, 50, 50, 0.5));
    border-color: rgba(255, 50, 50, 0.6);
  }

  .keyboard-key.cancel:hover {
    background: linear-gradient(135deg, rgba(200, 0, 0, 0.7), rgba(255, 50, 50, 0.7));
  }

  .keyboard-footer {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(0, 170, 255, 0.2);
  }

  .controls-hint {
    display: flex;
    justify-content: space-around;
    font-size: 0.75rem;
    opacity: 0.6;
  }

  .controls-hint span {
    padding: 0.25rem 0.5rem;
    background: rgba(0, 170, 255, 0.1);
    border-radius: 0.25rem;
  }

  @media (max-width: 768px) {
    .keyboard-key {
      width: 45px;
      height: 45px;
      font-size: 1rem;
    }

    .keyboard-key.special {
      width: 60px;
    }

    .input-value {
      font-size: 1.5rem;
    }

    .controls-hint {
      flex-direction: column;
      gap: 0.5rem;
      text-align: center;
    }
  }
</style>
