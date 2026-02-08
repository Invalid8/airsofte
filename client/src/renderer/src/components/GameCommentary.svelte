<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { fly, fade } from 'svelte/transition'
  import { geminiApiClient } from '../utils/geminiApiClient'
  import type { GameCommentaryParams } from '../utils/geminiApiClient'
  import { gameEvents } from '../lib/eventBus'
  import { gameManager } from '../lib/gameManager'

  let {
    sessionId
  }: {
    sessionId: string
  } = $props()

  let currentCommentary = $state<string>('')
  let showCommentary = $state(false)
  let isOnline = $state(true)

  async function requestCommentary(params: Omit<GameCommentaryParams, 'sessionId'>) {
    if (!isOnline) return

    try {
      const commentary = await geminiApiClient.getGameCommentary({
        ...params,
        sessionId
      })

      if (commentary) {
        currentCommentary = commentary
        showCommentary = true

        setTimeout(() => {
          showCommentary = false
        }, 5000)
      }
    } catch (error) {
      isOnline = false
    }
  }

  function handleComboUpdate(event: any) {
    const multiplier = event.data?.multiplier || 1
    if (multiplier >= 3) {
      requestCommentary({
        eventType: 'COMBO',
        context: {
          comboMultiplier: multiplier,
          playerHealth: gameManager.player.health
        }
      })
    }
  }

  function handlePlayerHit() {
    if (gameManager.player.health < 30) {
      requestCommentary({
        eventType: 'NEAR_DEATH',
        context: {
          playerHealth: gameManager.player.health
        }
      })
    }
  }

  function handleBossSpawn() {
    requestCommentary({
      eventType: 'BOSS_SPAWN',
      context: {
        bossName: 'Guardian',
        waveNumber: gameManager.session.currentWave
      }
    })
  }

  function handleBossDefeat() {
    requestCommentary({
      eventType: 'BOSS_DEFEAT',
      context: {
        bossName: 'Guardian',
        waveNumber: gameManager.session.currentWave
      }
    })
  }

  function handleWaveComplete(event: any) {
    requestCommentary({
      eventType: 'WAVE_COMPLETE',
      context: {
        waveNumber: event.data.wave,
        enemiesDefeated: gameManager.session.enemiesDefeated
      }
    })
  }

  function handlePowerUpCollected(event: any) {
    requestCommentary({
      eventType: 'POWER_UP',
      context: {
        powerUpType: event.data.type,
        playerHealth: gameManager.player.health
      }
    })
  }

  let unsubCombo: (() => void) | null = null
  let unsubHit: (() => void) | null = null
  let unsubBossSpawn: (() => void) | null = null
  let unsubBossDefeat: (() => void) | null = null
  let unsubWaveComplete: (() => void) | null = null
  let unsubPowerUp: (() => void) | null = null

  onMount(() => {
    geminiApiClient.checkHealth().then((online) => {
      isOnline = online
    })

    unsubCombo = gameEvents.on('COMBO_UPDATED', handleComboUpdate)
    unsubHit = gameEvents.on('PLAYER_HIT', handlePlayerHit)
    unsubBossSpawn = gameEvents.on('ENEMY_SPAWNED', (event) => {
      if (event.data?.isBoss) handleBossSpawn()
    })
    unsubBossDefeat = gameEvents.on('BOSS_DEFEATED', handleBossDefeat)
    unsubWaveComplete = gameEvents.on('WAVE_COMPLETE', handleWaveComplete)
    unsubPowerUp = gameEvents.on('POWERUP_COLLECTED', handlePowerUpCollected)

    return () => {
      if (unsubCombo) unsubCombo()
      if (unsubHit) unsubHit()
      if (unsubBossSpawn) unsubBossSpawn()
      if (unsubBossDefeat) unsubBossDefeat()
      if (unsubWaveComplete) unsubWaveComplete()
      if (unsubPowerUp) unsubPowerUp()
    }
  })

  onDestroy(() => {})
</script>

{#if showCommentary && currentCommentary}
  <div
    class="game-commentary fixed top-32 right-1/2 translate-x-1/2 z-50 max-w-2xl px-4"
    in:fly={{ y: -50, duration: 400 }}
    out:fade={{ duration: 300 }}
  >
    <div
      class="commentary-card bg-black/95 border-2 border-yellow-500 rounded-lg p-6 shadow-2xl text-center"
    >
      <div class="commentary-text text-2xl font-bold leading-tight">
        {currentCommentary}
      </div>
    </div>
  </div>
{/if}

<style>
  .commentary-card {
    backdrop-filter: blur(10px);
    animation: pulse-glow 1.5s ease-in-out infinite;
  }

  @keyframes pulse-glow {
    0%,
    100% {
      border-color: rgba(255, 215, 0, 1);
      box-shadow: 0 0 25px rgba(255, 215, 0, 0.5);
    }
    50% {
      border-color: rgba(255, 215, 0, 0.8);
      box-shadow: 0 0 35px rgba(255, 215, 0, 0.7);
    }
  }

  .commentary-text {
    font-family: 'Press Start 2P', cursive;
    color: #ffd700;
    text-shadow: 0 0 15px rgba(255, 215, 0, 0.8);
    word-spacing: -5px;
    line-height: 1.8;
  }

  @media (max-width: 768px) {
    .commentary-text {
      font-size: 1.25rem;
      line-height: 1.6;
    }
  }
</style>
