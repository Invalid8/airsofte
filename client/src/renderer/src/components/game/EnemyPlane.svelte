<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type { Enemy, Bullet, MovementPattern } from '../../types/gameTypes'
  import { EnemyController } from '../../lib/enemyController'
  import { EnemySpawner } from '../../lib/enemySpawner'
  import { gameManager } from '../../lib/gameManager'
  import { gameEvents } from '../../lib/eventBus'
  import { combatSystem } from '../../lib/combatSystem'
  import { particleSystem } from '../../lib/particleSystem'
  import { ScreenEffects } from '../../lib/screenEffects'
  import { getBoundingBox } from '../../utils/collisionSystem'
  import { enhancedParticles } from '../../lib/enhancedParticles'
  import { viewportCuller } from '../../utils/viewportCuller'
  import EnemyBasic from '../../assets/sprites/enemy-basic.png'
  import EnemyScout from '../../assets/sprites/enemy-scout.png'
  import EnemyBomber from '../../assets/sprites/enemy-bomber.png'
  import BossHealthBar from '../BossHealthBar.svelte'

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
  let enemyCollisionCooldowns = new Map<string, number>()

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

    enemyBullets = viewportCuller.cullBullets(enemyBullets, game_pad.clientHeight)

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

      particleSystem.createHitEffect(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 4)

      const killed = enemyController.damageEnemy(enemyId, damage)

      bullet.active = false

      if (killed) {
        if (enemy.type === 'BOSS') {
          enhancedParticles.createBigExplosion(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2
          )
          ScreenEffects.shake(10, 0.3)
        } else {
          particleSystem.createExplosion(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2,
            12,
            '#ff6600'
          )
          ScreenEffects.shake(3, 0.15)
        }
      }
    })

    const playerBox = getBoundingBox(playerX, playerY, 150, 150)
    const enemyBulletHits = combatSystem.checkEnemyBulletCollisions(enemyBullets, playerBox)

    enemyBulletHits.forEach(({ bulletId, damage }) => {
      const bullet = enemyBullets.find((b) => b.id === bulletId)
      if (!bullet) return

      gameManager.damagePlayer(damage)
      bullet.active = false

      particleSystem.createHitEffect(bullet.x, bullet.y, 5)
      ScreenEffects.shake(5, 0.2)
      ScreenEffects.flash('rgba(255, 0, 0, 0.2)', 0.1)
    })

    const playerEnemyCollisions = combatSystem.checkPlayerEnemyCollisions(playerBox, enemies)

    const now = Date.now()
    playerEnemyCollisions.forEach(({ enemyId, isBoss }) => {
      const enemy = enemyController.getEnemyById(enemyId)
      if (!enemy) return

      const lastCollision = enemyCollisionCooldowns.get(enemyId) || 0
      if (now - lastCollision < 500) return

      if (!gameManager.player.invincible && !gameManager.player.shieldActive) {
        enemyCollisionCooldowns.set(enemyId, now)

        if (isBoss) {
          const playerHealthPercent = gameManager.player.health / gameManager.player.maxHealth
          const bossHealthPercent = enemy.health / enemy.maxHealth

          const damageToPlayer = Math.floor(60 * bossHealthPercent)
          gameManager.damagePlayer(damageToPlayer)

          const damageToBoss = Math.floor(enemy.maxHealth * playerHealthPercent * 0.4)
          enemyController.damageEnemy(enemyId, damageToBoss)

          particleSystem.createExplosion(
            playerX + 75,
            playerY + 75,
            15,
            '#ff6600'
          )
          ScreenEffects.shake(8, 0.2)
          ScreenEffects.flash('rgba(255, 100, 0, 0.2)', 0.1)
        } else {
          gameManager.damagePlayer(30)

          particleSystem.createExplosion(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2,
            12,
            '#ff3300'
          )
          ScreenEffects.shake(5, 0.2)
          ScreenEffects.flash('rgba(255, 0, 0, 0.2)', 0.1)

          enemyController.damageEnemy(enemyId, enemy.maxHealth)
        }
      }
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
    if (!game_pad) return null

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

    const unsubContinuous = gameEvents.on('SPAWN_CONTINUOUS_ENEMIES', (event) => {
      const { count, types } = event.data

      for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)]
        const pattern = ['STRAIGHT', 'WAVE', 'ZIGZAG'][
          Math.floor(Math.random() * 3)
        ] as MovementPattern

        const x = Math.random() * (game_pad.clientWidth - 80)
        enemyController.spawnEnemy(type, x, -100, pattern)
      }
    })

    return () => {
      unsubContinuous()
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

<BossHealthBar />

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
  }

  .enemy {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 0 6px rgba(255, 0, 0, 0.4));
  }

  .enemy.damaged {
    filter: drop-shadow(0 0 10px rgba(255, 100, 0, 0.7)) brightness(1.1);
  }

  .enemy.damaged-critical {
    filter: drop-shadow(0 0 12px rgba(255, 0, 0, 0.9)) brightness(1.3);
    animation: flash 0.3s infinite;
  }

  .enemy.teleporting {
    filter: drop-shadow(0 0 15px rgba(0, 170, 255, 0.9)) brightness(1.2);
  }

  .portal-effect {
    position: absolute;
    inset: -15px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0, 170, 255, 0.3) 0%, transparent 70%);
    border: 2px solid rgba(0, 170, 255, 0.5);
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
      opacity: 0.7;
    }
  }

  @keyframes flash {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
  }

  .enemy-bullet {
    position: absolute;
    pointer-events: none;
    background: linear-gradient(to bottom, #ff0000, #ff6600);
    border-radius: 0 0 50% 50%;
    box-shadow: 0 0 6px #ff3333;
  }
</style>
