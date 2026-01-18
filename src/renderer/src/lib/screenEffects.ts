import { gsap } from 'gsap'

export class ScreenEffects {
  private static shakeElement: HTMLElement | null = null
  private static flashElement: HTMLElement | null = null

  static initialize(gameContainer: HTMLElement): void {
    this.shakeElement = gameContainer
  }

  static shake(intensity: number = 10, duration: number = 0.3): void {
    if (!this.shakeElement) return

    const tl = gsap.timeline()

    tl.to(this.shakeElement, {
      x: `+=${Math.random() * intensity - intensity / 2}`,
      y: `+=${Math.random() * intensity - intensity / 2}`,
      duration: 0.05,
      ease: 'none'
    })

    for (let i = 0; i < duration / 0.05; i++) {
      tl.to(this.shakeElement, {
        x: `+=${Math.random() * intensity - intensity / 2}`,
        y: `+=${Math.random() * intensity - intensity / 2}`,
        duration: 0.05,
        ease: 'none'
      })
    }

    tl.to(this.shakeElement, {
      x: 0,
      y: 0,
      duration: 0.1,
      ease: 'power2.out'
    })
  }

  static flash(color: string = 'rgba(255, 255, 255, 0.5)', duration: number = 0.2): void {
    if (!this.shakeElement) return

    const overlay = document.createElement('div')
    overlay.style.position = 'absolute'
    overlay.style.top = '0'
    overlay.style.left = '0'
    overlay.style.width = '100%'
    overlay.style.height = '100%'
    overlay.style.backgroundColor = color
    overlay.style.pointerEvents = 'none'
    overlay.style.zIndex = '9999'

    this.shakeElement.appendChild(overlay)

    gsap.to(overlay, {
      opacity: 0,
      duration,
      ease: 'power2.out',
      onComplete: () => {
        overlay.remove()
      }
    })
  }

  static slowMotion(duration: number = 1000, timeScale: number = 0.3): void {
    gsap.globalTimeline.timeScale(timeScale)

    setTimeout(() => {
      gsap.globalTimeline.timeScale(1)
    }, duration)
  }

  static hitStop(duration: number = 100): Promise<void> {
    return new Promise((resolve) => {
      gsap.globalTimeline.timeScale(0)

      setTimeout(() => {
        gsap.globalTimeline.timeScale(1)
        resolve()
      }, duration)
    })
  }
}
