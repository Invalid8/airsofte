/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Format large numbers with K/M notation
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString()
}

/**
 * Format number with commas
 */
export function formatNumberWithCommas(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * Detect device type
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const userAgent = navigator.userAgent.toLowerCase()
  const isMobile =
    /iphone|ipod|android.*mobile|windows phone|blackberry|bb10|opera mini|mobile/i.test(userAgent)
  // const isTablet = /ipad|android(?!.*mobile)|tablet|kindle|silk|playbook/i.test(userAgent)

  // Check screen size as fallback
  const width = window.innerWidth
  const height = window.innerHeight
  const minDimension = Math.min(width, height)
  // const maxDimension = Math.max(width, height)

  if (isMobile || minDimension < 450) {
    return 'mobile'
  }

  return 'desktop'
}

/**
 * Check if touch is supported
 */
export function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  )
}

/**
 * Check if device is in landscape mode
 */
export function isLandscape(): boolean {
  return window.innerWidth > window.innerHeight
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

/**
 * Check if arrays are safe to access
 */
export function safeArrayAccess<T>(arr: T[], index: number): T | undefined {
  if (!Array.isArray(arr)) return undefined
  if (index < 0 || index >= arr.length) return undefined
  return arr[index]
}

/**
 * Create safe array from number
 */
export function safeArray(length: number): number[] {
  const safeLength = Math.max(0, Math.min(100, Math.floor(length)))
  return Array(safeLength)
    .fill(0)
    .map((_, i) => i)
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = (): any => {
      timeout = null
      func(...args)
    }

    if (timeout !== null) {
      clearTimeout(timeout)
    }
    timeout = window.setTimeout(later, wait)
  }
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function replicateLoadFunctions(): (() => Promise<void>)[] {
  return [
    async (): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      console.log('Initializing systems...')
    },
    async (): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      console.log('Calibrating sensors...')
    },
    async (): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      console.log('Preparing launch sequence...')
    }
  ]
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
