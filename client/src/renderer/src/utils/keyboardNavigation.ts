import { onMount } from 'svelte'
import { audioManager } from './AudioManager'

export function createKeyboardNavigation<T extends HTMLElement>(
  getElements: () => T[],
  options: {
    vertical?: boolean
    horizontal?: boolean
    loop?: boolean
    autoFocus?: boolean
    onSelect?: (element: T) => void
  } = {}
): {
  setup: () => void
} {
  const { vertical = true, horizontal = false, loop = true, autoFocus = true, onSelect } = options

  const handleKeydown = (event: KeyboardEvent): void => {
    const elements = getElements()
    if (!elements.length) return

    const currentIndex = elements.findIndex((el) => el === document.activeElement)
    let nextIndex = currentIndex

    if (vertical) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % elements.length
        if (!loop && nextIndex < currentIndex) nextIndex = currentIndex
        audioManager.playSound('sound1')
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        nextIndex =
          currentIndex < 0
            ? elements.length - 1
            : (currentIndex - 1 + elements.length) % elements.length
        if (!loop && nextIndex > currentIndex) nextIndex = currentIndex
        audioManager.playSound('sound1')
      }
    }

    if (horizontal) {
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % elements.length
        if (!loop && nextIndex < currentIndex) nextIndex = currentIndex
        audioManager.playSound('sound1')
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        nextIndex =
          currentIndex < 0
            ? elements.length - 1
            : (currentIndex - 1 + elements.length) % elements.length
        if (!loop && nextIndex > currentIndex) nextIndex = currentIndex
        audioManager.playSound('sound1')
      }
    }

    if ((event.key === 'Enter' || event.key === ' ') && currentIndex >= 0 && onSelect) {
      event.preventDefault()
      onSelect(elements[currentIndex])
      return
    }

    if (nextIndex !== currentIndex && elements[nextIndex]) {
      elements[nextIndex]?.focus()
    }
  }

  const setup = (): void => {
    onMount(() => {
      window.addEventListener('keydown', handleKeydown)

      if (autoFocus) {
        const elements = getElements()
        if (elements.length > 0) {
          elements[0]?.focus()
        }
      }

      return () => {
        window.removeEventListener('keydown', handleKeydown)
      }
    })
  }

  return { setup }
}
