export function replicateLoadFunctions(): (() => Promise<void>)[] {
  return [
    async (): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 500))
    },
    async (): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 500))
    },
    async (): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  ]
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
