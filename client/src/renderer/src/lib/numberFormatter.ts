export function formatScore(score: number): string {
  if (score >= 1_000_000_000) {
    return `${(score / 1_000_000_000).toFixed(1)}B`
  }
  if (score >= 1_000_000) {
    return `${(score / 1_000_000).toFixed(1)}M`
  }
  if (score >= 1_000) {
    return `${(score / 1_000).toFixed(1)}K`
  }
  return score.toLocaleString()
}

export function formatLargeNumber(num: number): string {
  return num.toLocaleString()
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function formatTimeDetailed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}
