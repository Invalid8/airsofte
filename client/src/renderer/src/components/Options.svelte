<script lang="ts">
  import { audioManager } from '../utils/AudioManager'
  import Button from './Button.svelte'

  let {
    select,
    options,
    layout = 'vertical',
    cols = 1,
    gap = 'md',
    selectedValue = $bindable(''),
    useKeyboardNav = true,
    autoFocus = true
  }: {
    select?: (value: string) => void
    options: Array<{
      label: string
      value: string
      isFirst?: boolean
      disabled?: boolean
      onClick?: () => void
    }>
    layout?: 'grid' | 'vertical' | 'horizontal'
    cols?: 1 | 2 | 3 | 4
    gap?: 'sm' | 'md' | 'lg'
    selectedValue?: string
    useKeyboardNav?: boolean
    autoFocus?: boolean
  } = $props()

  let optionButtons: HTMLButtonElement[] = $state([])
  let currentIndex = $state(0)
  let keydownHandler: ((e: KeyboardEvent) => void) | null = null

  function handleSelect(value: string, index: number, onClick?: () => void): void {
    currentIndex = index
    selectedValue = value
    audioManager.playSound('menuClick')

    if (select) {
      select(value)
    }

    if (onClick) {
      onClick()
    }
  }

  function focusButton(index: number): void {
    if (optionButtons[index]) {
      optionButtons[index].focus()
      currentIndex = index
    }
  }

  function handleKeyNavigation(event: KeyboardEvent): void {
    const isVerticalNav = layout === 'vertical' || layout === 'grid'
    const isHorizontalNav = layout === 'horizontal' || layout === 'grid'

    let newIndex = currentIndex
    const enabledIndices = options
      .map((opt, idx) => (!opt.disabled ? idx : -1))
      .filter((idx) => idx >= 0)

    if (!enabledIndices.length) return

    const currentEnabledPos = enabledIndices.indexOf(currentIndex)

    if (isVerticalNav && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault()

      if (event.key === 'ArrowDown') {
        const nextPos = (currentEnabledPos + 1) % enabledIndices.length
        newIndex = enabledIndices[nextPos]
      } else {
        const prevPos = (currentEnabledPos - 1 + enabledIndices.length) % enabledIndices.length
        newIndex = enabledIndices[prevPos]
      }

      audioManager.playSound('menuClick', 0.3)
    }

    if (isHorizontalNav && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
      event.preventDefault()

      if (event.key === 'ArrowRight') {
        const nextPos = (currentEnabledPos + 1) % enabledIndices.length
        newIndex = enabledIndices[nextPos]
      } else {
        const prevPos = (currentEnabledPos - 1 + enabledIndices.length) % enabledIndices.length
        newIndex = enabledIndices[prevPos]
      }

      audioManager.playSound('menuClick', 0.3)
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (optionButtons[currentIndex]) {
        optionButtons[currentIndex].click()
      }
    }

    if (newIndex !== currentIndex) {
      focusButton(newIndex)
    }
  }

  $effect(() => {
    if (useKeyboardNav && optionButtons.length > 0) {
      keydownHandler = handleKeyNavigation
      window.addEventListener('keydown', keydownHandler)

      // Auto-focus first enabled option
      if (autoFocus) {
        const firstEnabled = options.findIndex((opt) => !opt.disabled)
        if (firstEnabled >= 0) {
          setTimeout(() => focusButton(firstEnabled), 100)
        }
      }

      return () => {
        if (keydownHandler) {
          window.removeEventListener('keydown', keydownHandler)
        }
      }
    }
    return null
  })

  const layoutClass = $derived(() => {
    if (layout === 'grid') return `grid grid-cols-${cols}`
    if (layout === 'vertical') return 'flex flex-col'
    return 'flex flex-row flex-wrap'
  })

  const gapClass = $derived(
    () =>
      ({
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6'
      })[gap]
  )
</script>

<div class="options-container w-full">
  <ul class="{layoutClass} {gapClass} list-none p-0 m-0">
    {#each options as option, i (option.value + i)}
      <li class="w-full flex justify-center items-center">
        <Button
          bind:buttonRef={optionButtons[i]}
          label={option.label}
          isFirst={option.isFirst || i === 0}
          disabled={option.disabled || false}
          class={selectedValue === option.value ? 'selected' : ''}
          onClick={() => handleSelect(option.value, i, option.onClick)}
        />
      </li>
    {/each}
  </ul>
</div>

<style>
  .options-container {
    max-width: 100%;
  }

  :global(.selected) {
    box-shadow: 0 0 20px rgba(0, 170, 255, 0.8) !important;
  }
</style>
