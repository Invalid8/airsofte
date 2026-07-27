import { browser } from '$app/environment'

declare global {
  interface Window {
    __TAURI__?: unknown
  }
}

export const isTauri = browser && typeof window !== 'undefined' && '__TAURI__' in window

/**
 * Detect if running in web browser
 */
export const isWeb = browser && !isTauri

/**
 * Detect if running on server
 */
export const isServer = !browser

/**
 * Get current platform
 */
export function getPlatform(): 'tauri' | 'web' | 'server' {
  if (!browser) return 'server'
  if (isTauri) return 'tauri'
  return 'web'
}

/**
 * Check if feature is available on current platform
 */
export function hasFeature(
  feature: 'desktop-window' | 'file-system' | 'local-storage' | 'server-api'
): boolean {
  switch (feature) {
    case 'desktop-window':
      return isTauri
    case 'file-system':
      return isTauri
    case 'local-storage':
      return browser
    case 'server-api':
      return isWeb || isServer
    default:
      return false
  }
}

/**
 * Execute code conditionally based on platform
 */
export function ifPlatform<T>(platform: 'tauri' | 'web' | 'server', fn: () => T): T | null {
  const current = getPlatform()
  return current === platform ? fn() : null
}
