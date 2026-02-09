<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { fly, fade } from 'svelte/transition'
  import { geminiApiClient } from '../utils/geminiApiClient'
  import type { EnhancedTacticalHintParams } from '../utils/geminiApiClient'
  import { gameEvents } from '../lib/eventBus'
  import { gameManager } from '../lib/gameManager'

  let {
    sessionId
  }: {
    sessionId: string
  } = $props()

  let currentHint = $state<string>('')
  let showHint = $state(false)
  let isOnline = $state(true)
  let lastHintTime = $state(0)
  let hintCooldown = 15000

  async function requestHint(playerHealth: number, enemyTypes: string[], waveNumber: number) {
    const now = Date.now()
    if (now - lastHintTime < hintCooldown) return
    if (!isOnline) return

    lastHintTime = now

    const params: EnhancedTacticalHintParams = {
      playerHealth,
      enemyTypes,
      playerWeapon: gameManager.player.weaponType,
      waveNumber,
      comboMultiplier: gameManager.session.comboMultiplier,
      activePowerUps: getActivePowerUps(),
      sessionId
    }

    try {
      const hint = await geminiApiClient.getEnhancedTacticalHint(params)
      if (!hint) return
      currentHint = hint
      showHint = true
    } catch {
      isOnline = false
      return
    }

    setTimeout(() => (showHint = false), 8000)
  }

  function getActivePowerUps(): string[] {
    const powerUps: string[] = []
    if (gameManager.player.shieldActive) powerUps.push('Shield')
    if (gameManager.player.speedBoostActive) powerUps.push('Speed')
    if (gameManager.player.weaponType !== 'SINGLE') powerUps.push(gameManager.player.weaponType)
    return powerUps
  }

  function handlePlayerHit() {
    if (gameManager.player.health < 30) {
      const enemies = gameManager.currentWave?.enemies.map((e) => e.type) || []
      requestHint(gameManager.player.health, enemies, gameManager.session.currentWave)
    }
  }

  function handleWaveStart(event: any) {
    const enemies = gameManager.currentWave?.enemies.map((e) => e.type) || []
    requestHint(gameManager.player.health, enemies, event.data.wave)
  }

  let unsubHit: (() => void) | null = null
  let unsubWaveStart: (() => void) | null = null

  onMount(() => {
    geminiApiClient.checkHealth().then((online) => {
      isOnline = online
    })

    unsubHit = gameEvents.on('PLAYER_HIT', handlePlayerHit)
    unsubWaveStart = gameEvents.on('WAVE_START', handleWaveStart)

    return () => {
      if (unsubHit) unsubHit()
      if (unsubWaveStart) unsubWaveStart()
    }
  })

  onDestroy(() => {
    if (sessionId) {
      geminiApiClient.cleanupSession(sessionId)
    }
  })
</script>

{#if showHint && currentHint}
  <div
    class="tactical-hint fixed bottom-5 right-5 z-50 max-w-md"
    in:fly={{ x: 300, duration: 300 }}
    out:fade={{ duration: 200 }}
  >
    <div class="hint-card bg-black/90 border-2 border-cyan-500 rounded-lg p-4 shadow-2xl">
      <div class="hint-header text-xs opacity-70 uppercase mb-2">Tactical Hint</div>
      <div class="hint-text text-sm leading-relaxed">{currentHint}</div>
    </div>
  </div>
{/if}

<style>
  .hint-card {
    backdrop-filter: blur(8px);
    animation: pulse-border 2s ease-in-out infinite;
  }

  @keyframes pulse-border {
    0%,
    100% {
      border-color: rgba(0, 170, 255, 1);
      box-shadow: 0 0 20px rgba(0, 170, 255, 0.4);
    }
    50% {
      border-color: rgba(0, 170, 255, 0.7);
      box-shadow: 0 0 30px rgba(0, 170, 255, 0.6);
    }
  }

  .hint-header {
    font-family: 'Orbitron', sans-serif;
    color: #00aaff;
  }

  .hint-text {
    font-family: 'Orbitron', sans-serif;
  }
</style>
