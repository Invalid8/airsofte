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
