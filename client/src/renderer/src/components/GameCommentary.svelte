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
  let lastCommentaryTime = $state(0)
  let commentaryCooldown = 15000
  let lastEventType = $state<string>('')

  async function requestCommentary(params: Omit<GameCommentaryParams, 'sessionId'>) {
    const now = Date.now()

    if (now - lastCommentaryTime < commentaryCooldown) return

    if (!isOnline) return

    const eventKey = `${params.eventType}-${JSON.stringify(params.context)}`
    if (eventKey === lastEventType) return

    lastCommentaryTime = now
    lastEventType = eventKey

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
    if (multiplier >= 5) {
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
    if (gameManager.player.health < 20) {
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
    const waveNum = event.data.wave
    if (waveNum % 3 === 0) {
      requestCommentary({
        eventType: 'WAVE_COMPLETE',
        context: {
          waveNumber: waveNum,
          enemiesDefeated: gameManager.session.enemiesDefeated
        }
      })
    }
  }

  function handlePowerUpCollected(event: any) {
    console.log(event)
    // Skip power-up commentary - least important event
    // Uncomment below if you want selective power-up commentary
    // const importantPowerUps = ['SHIELD', 'HEALTH', 'WEAPON_UPGRADE']
    // if (importantPowerUps.includes(event.data.type)) {
    //   requestCommentary({
    //     eventType: 'POWER_UP',
    //     context: {
    //       powerUpType: event.data.type,
    //       playerHealth: gameManager.player.health
    //     }
    //   })
    // }
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
    class="game-commentary fixed bottom-6 left-6 z-50 max-w-md"
    in:fly={{ x: -300, duration: 400 }}
    out:fade={{ duration: 300 }}
  >
    <div class="commentary-card bg-black/80 border-2 border-yellow-500 rounded-lg p-4 shadow-2xl">
      <div class="commentary-text text-lg font-bold leading-snug">
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
    line-height: 1.6;
  }

  @media (max-width: 768px) {
    .commentary-text {
      font-size: 1rem;
      line-height: 1.5;
    }
  }
</style>
