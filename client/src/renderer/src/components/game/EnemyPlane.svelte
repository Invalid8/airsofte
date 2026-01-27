<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type { Enemy, Bullet } from '../../types/gameTypes'
  import { EnemyController } from '../../lib/enemyController'
  import { EnemySpawner } from '../../lib/enemySpawner'
  import { gameManager } from '../../lib/gameManager'
  import { gameEvents } from '../../lib/eventBus'
  import { combatSystem } from '../../lib/combatSystem'
  import { particleSystem } from '../../lib/particleSystem'
  import { ScreenEffects } from '../../lib/screenEffects'
  import { getBoundingBox } from '../../utils/collisionSystem'
  import { enhancedParticles } from '../../lib/enhancedParticles'
  import EnemyBasic from '../../assets/sprites/enemy-basic.png'
  import EnemyScout from '../../assets/sprites/enemy-scout.png'
  import EnemyBomber from '../../assets/sprites/enemy-bomber.png'

  let {
    game_pad,
    playerBullets = $bindable([]),
    playerX = 0,
    playerY = 0
  }: {
    game_pad: HTMLDivElement
    playerBullets?: Bullet[]
    playerX?: number
    playerY?: number
  } = $props()

  let enemyController: EnemyController
  let enemySpawner: EnemySpawner
  let enemies = $state<Enemy[]>([])
  let enemyBullets = $state<Bullet[]>([])
  let animationFrameId: number
  let updateCounter = $state(0)

  const enemySprites = {
    BASIC: EnemyBasic,
    SCOUT: EnemyScout,
    BOMBER: EnemyBomber,
    BOSS: EnemyBasic
  }

  function getEnemySprite(type: Enemy['type']): string {
    return enemySprites[type]
  }

  function getEnemyClass(enemy: Enemy): string {
    const healthPercent = (enemy.health / enemy.maxHealth) * 100
    const classes = []

    if (healthPercent < 30) classes.push('damaged-critical')
    else if (healthPercent < 60) classes.push('damaged')

    if (enemy.pattern === 'TELEPORT' && enemy.patternData?.teleportState?.isTeleporting) {
      classes.push('teleporting')
    }

    return classes.join(' ')
  }

  function getEnemyStyle(enemy: Enemy): string {
    const baseStyle = `left: ${enemy.x}px; top: ${enemy.y}px; width: ${enemy.width}px; height: ${enemy.height}px; transform: rotate(180deg)`

    if (enemy.pattern === 'TELEPORT' && enemy.patternData) {
      const opacity = enemy.patternData.opacity ?? 1
      const scale = enemy.patternData.scale ?? 1
      return `${baseStyle}; opacity: ${opacity}; transform: rotate(180deg) scale(${scale})`
    }

    return baseStyle
  }

  function shouldShowPortalEffect(enemy: Enemy): boolean {
    if (enemy.pattern !== 'TELEPORT') return false
    const state = enemy.patternData?.teleportState
    if (!state) return false
    return state.isTeleporting && (state.teleportProgress < 0.3 || state.teleportProgress > 0.7)
  }

  function updateGame(): void {
    if (!gameManager.isPlaying) {
      animationFrameId = requestAnimationFrame(updateGame)
      return
    }

    if (gameManager.isPaused) {
      animationFrameId = requestAnimationFrame(updateGame)
      return
    }

    const bounds = getBoundingBox(0, 0, game_pad.clientWidth, game_pad.clientHeight)

    const newBullets = enemyController.updateEnemies(16, bounds, playerX, playerY)
    enemyBullets = [...enemyBullets, ...newBullets]

    enemyBullets = enemyBullets.filter((bullet) => {
      if (!bullet.active) return false

      bullet.y += bullet.speed

      if (bullet.y > bounds.height + 30) {
        bullet.active = false
        return false
      }

      return true
    })

    checkCollisions()

    const activeEnemies = enemyController.getActiveEnemies()
    enemies = activeEnemies.map((e) => ({
      ...e,
      patternData: e.patternData ? { ...e.patternData } : undefined
    }))

    const boss = enemies.find((e) => e.type === 'BOSS')
    if (boss) {
      gameEvents.emit('BOSS_UPDATE', { enemy: boss })
    }

    updateCounter++

    animationFrameId = requestAnimationFrame(updateGame)
  }

  function checkCollisions(): void {
    const visibleEnemies = enemies.filter((e) => e.y >= -100 && e.y <= game_pad.clientHeight + 100)
    const playerBulletHits = combatSystem.checkPlayerBulletCollisions(playerBullets, visibleEnemies)

    playerBulletHits.forEach(({ bulletId, enemyId, damage }) => {
      const bullet = playerBullets.find((b) => b.id === bulletId)
      if (!bullet) return

      const enemy = enemyController.getEnemyById(enemyId)
      if (!enemy) return

      particleSystem.createHitEffect(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 6)

      const killed = enemyController.damageEnemy(enemyId, damage)

      bullet.active = false

      if (killed) {
        if (enemy.type === 'BOSS') {
          enhancedParticles.createBossDeathExplosion(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2
          )
        } else {
          particleSystem.createExplosion(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2,
            25,
            '#ff6600'
          )
        }
        ScreenEffects.shake(enemy.type === 'BOSS' ? 15 : 5, enemy.type === 'BOSS' ? 0.5 : 0.2)
      }
    })

    const playerBox = getBoundingBox(playerX, playerY, 150, 150)
    const enemyBulletHits = combatSystem.checkEnemyBulletCollisions(enemyBullets, playerBox)

    enemyBulletHits.forEach(({ bulletId, damage }) => {
      const bullet = enemyBullets.find((b) => b.id === bulletId)
      if (!bullet) return

      gameManager.damagePlayer(damage)
      bullet.active = false

      particleSystem.createHitEffect(bullet.x, bullet.y, 8)
      ScreenEffects.shake(8, 0.3)
      ScreenEffects.flash('rgba(255, 0, 0, 0.3)', 0.15)
    })

    const playerEnemyCollisions = combatSystem.checkPlayerEnemyCollisions(playerBox, enemies)

    playerEnemyCollisions.forEach(({ enemyId }) => {
      const enemy = enemyController.getEnemyById(enemyId)
      if (!enemy) return

      if (!gameManager.player.invincible && !gameManager.player.shieldActive) {
        gameManager.damagePlayer(30)

        particleSystem.createExplosion(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2,
          20,
          '#ff3300'
        )
        ScreenEffects.shake(12, 0.4)
        ScreenEffects.flash('rgba(255, 0, 0, 0.5)', 0.2)
      }

      enemyController.damageEnemy(enemyId, enemy.maxHealth)
    })
  }

  function handleWaveStart(): void {
    if (!gameManager.currentWave) return
    if (enemySpawner) {
      enemySpawner.startWave(gameManager.currentWave)
    }
  }

  function handleGameStart(): void {
    enemyController.clearAllEnemies()
    enemies = []
    enemyBullets = []

    setTimeout(() => {
      if (gameManager.currentWave && enemySpawner) {
        enemySpawner.startWave(gameManager.currentWave)
      }
    }, 1000)
  }

  let unsubWaveStart: (() => void) | null = null
  let unsubGameStart: (() => void) | null = null

  onMount(() => {
    if (!game_pad) return

    const bounds = {
      width: game_pad.clientWidth,
      height: game_pad.clientHeight
    }

    ScreenEffects.initialize(game_pad)

    enemyController = new EnemyController()
    enemySpawner = new EnemySpawner(enemyController, bounds)

    unsubWaveStart = gameEvents.on('WAVE_START', handleWaveStart)
    unsubGameStart = gameEvents.on('GAME_START', handleGameStart)

    animationFrameId = requestAnimationFrame(updateGame)

    if (gameManager.isPlaying && gameManager.currentWave) {
      setTimeout(() => {
        if (enemySpawner && gameManager.currentWave) {
          enemySpawner.startWave(gameManager.currentWave)
        }
      }, 1000)
    }
  })

  onDestroy(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
    if (enemySpawner) {
      enemySpawner.stop()
    }
    if (unsubWaveStart) unsubWaveStart()
    if (unsubGameStart) unsubGameStart()
  })
</script>

{#each enemies as enemy (enemy.id + '_' + updateCounter)}
  <div class="enemy-wrapper" style={getEnemyStyle(enemy)}>
    {#if shouldShowPortalEffect(enemy)}
      <div class="portal-effect"></div>
    {/if}
    <img
      class="enemy {getEnemyClass(enemy)}"
      src={getEnemySprite(enemy.type)}
      alt="Enemy {enemy.type}"
    />
  </div>
{/each}

{#each enemyBullets as bullet (bullet.id)}
  <div
    class="enemy-bullet"
    style="left: {bullet.x}px; top: {bullet.y}px; width: {bullet.width}px; height: {bullet.height}px;"
  ></div>
{/each}

<style>
  .enemy-wrapper {
    position: absolute;
    pointer-events: none;
    transition: opacity 0.1s ease;
  }

  .enemy {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 0 8px rgba(255, 0, 0, 0.5));
    transition: filter 0.2s;
  }

  .enemy.damaged {
    filter: drop-shadow(0 0 12px rgba(255, 100, 0, 0.8)) brightness(1.2);
  }

  .enemy.damaged-critical {
    filter: drop-shadow(0 0 16px rgba(255, 0, 0, 1)) brightness(1.5);
    animation: flash 0.2s infinite;
  }

  .enemy.teleporting {
    filter: drop-shadow(0 0 20px rgba(0, 170, 255, 1)) brightness(1.3);
  }

  .portal-effect {
    position: absolute;
    inset: -20px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0, 170, 255, 0.4) 0%, transparent 70%);
    border: 2px solid rgba(0, 170, 255, 0.6);
    animation: portal-pulse 0.6s ease-in-out;
    pointer-events: none;
  }

  @keyframes portal-pulse {
    0% {
      transform: scale(0.5);
      opacity: 0;
    }
    50% {
      transform: scale(1.2);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 0.8;
    }
  }

  @keyframes flash {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  .enemy-bullet {
    position: absolute;
    pointer-events: none;
    background: linear-gradient(to bottom, #ff0000, #ff6600);
    border-radius: 0 0 50% 50%;
    box-shadow: 0 0 8px #ff3333;
  }
</style>
