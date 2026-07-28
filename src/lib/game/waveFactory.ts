import type { Wave, WaveTemplate } from '$lib/types/gameTypes'

export function buildWaveFromTemplate(
  template: WaveTemplate,
  id: number,
  enemyCountMultiplier: number
): Wave {
  return {
    id,
    spawnInterval: template.spawnInterval,
    completed: false,
    enemies: template.enemies.map((enemy) => ({
      type: enemy.type,
      pattern: enemy.pattern,
      spawnDelay: enemy.spawnDelay,
      count: Math.ceil(enemy.count * enemyCountMultiplier)
    }))
  }
}

export function buildWaveSet(
  templates: readonly WaveTemplate[],
  enemyCountMultiplier: number
): Wave[] {
  return templates.map((template, index) =>
    buildWaveFromTemplate(template, index, enemyCountMultiplier)
  )
}
