<script lang="ts">
  import { createKeyboardNavigation } from '../utils/keyboardNavigation'
  import Button from './Button.svelte'

  let {
    select,
    options,
    layout = 'grid',
    cols = 1,
    gap = 'md',
    selectedValue = '',
    useKeyboardNav = true
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
  } = $props()

  let optionButtons: HTMLButtonElement[] = []

  // Handle option selection
  function handleSelect(value: string, onClick?: () => void): void {
    selectedValue = value
    select(value)

    // If a direct onClick function is provided, execute it
    if (onClick) {
      onClick()
    }
  }

  // Set up keyboard navigation if enabled
  $effect(() => {
    if (useKeyboardNav) {
      const navigation = createKeyboardNavigation(() => optionButtons, {
        vertical: layout !== 'horizontal',
        horizontal: layout !== 'vertical',
        loop: true,
        autoFocus: options.some((opt) => opt.isFirst),
        onSelect: (button) => button.click()
      })
      navigation.setup()
    }
  })

  const layoutClass = $derived(
    () =>
      ({
        grid: `grid grid-cols-${cols}`,
        vertical: 'flex flex-col',
        horizontal: 'flex flex-row'
      })[layout]
  )

  const gapClass = $derived(
    () =>
      ({
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6'
      })[gap]
  )
</script>

<div class="options-container">
  <ul class="{layoutClass} {gapClass}">
    {#each options as option, i (i)}
      <li>
        <Button
          bind:buttonRef={optionButtons[i]}
          label={option.label}
          isFirst={option.isFirst || false}
          isSelected={selectedValue === option.value}
          disabled={option.disabled || false}
          onClick={() => handleSelect(option.value, option.onClick)}
        />
      </li>
    {/each}
  </ul>
</div>

<style>
  .options-container {
    width: 100%;
  }

  ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
    width: 100%;
  }

  li {
    width: 100%;
  }
</style>
