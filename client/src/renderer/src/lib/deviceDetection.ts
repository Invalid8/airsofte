export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export function detectDevice(): DeviceType {
  if (typeof window === 'undefined') return 'desktop'

  const userAgent = navigator.userAgent.toLowerCase()
  const width = window.innerWidth

  const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  const isTablet =
    /ipad|android(?!.*mobile)|tablet/i.test(userAgent) || (width >= 768 && width <= 1024)

  if (isMobile && width < 768) {
    return 'mobile'
  }

  if (isTablet) {
    return 'tablet'
  }

  return 'desktop'
}

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

export function isLandscape(): boolean {
  if (typeof window === 'undefined') return true
  return window.innerWidth > window.innerHeight
}

export function getDeviceInfo(): {
  type: DeviceType
  isTouch: boolean
  isLandscape: boolean
  width: number
  height: number
} {
  return {
    type: detectDevice(),
    isTouch: isTouchDevice(),
    isLandscape: isLandscape(),
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  }
}
