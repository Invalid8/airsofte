<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { GameRuntime, type GameRuntimeState } from '$lib/game/gameRuntime'
  import type { Bullet, Enemy, PowerUp } from '$lib/types/gameTypes'

  let {
    game_pad,
    playerBullets = $bindable([]),
    enemyBullets = $bindable([]),
    enemies = $bindable([]),
    powerUps = $bindable([]),
    playerX = $bindable(0),
    playerY = $bindable(0),
    playerOpacity = $bindable(1),
    playerScale = $bindable(1),
    playerRotation = $bindable(0),
    playerOffsetY = $bindable(0),
    playerInvincible = $bindable(false)
  }: {
    game_pad: HTMLDivElement
    playerBullets?: Bullet[]
    enemyBullets?: Bullet[]
    enemies?: Enemy[]
    powerUps?: PowerUp[]
    playerX?: number
    playerY?: number
    playerOpacity?: number
    playerScale?: number
    playerRotation?: number
    playerOffsetY?: number
    playerInvincible?: boolean
  } = $props()

  let runtime: GameRuntime | null = null

  function updateState(state: GameRuntimeState): void {
    playerBullets = state.playerBullets
    enemyBullets = state.enemyBullets
    enemies = state.enemies
    powerUps = state.powerUps
    playerX = state.playerX
    playerY = state.playerY
    playerOpacity = state.playerOpacity
    playerScale = state.playerScale
    playerRotation = state.playerRotation
    playerOffsetY = state.playerOffsetY
    playerInvincible = state.playerInvincible
  }

  onMount(() => {
    runtime = new GameRuntime(game_pad, updateState)
    runtime.start()
  })

  onDestroy(() => {
    runtime?.stop()
  })
</script>
