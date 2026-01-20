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
    if (healthPercent < 30) return 'damaged-critical'
    if (healthPercent < 60) return 'damaged'
    return ''
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

    updateCounter++

    animationFrameId = requestAnimationFrame(updateGame)
  }

  function checkCollisions(): void {
    const playerBulletHits = combatSystem.checkPlayerBulletCollisions(playerBullets, enemies)

    playerBulletHits.forEach(({ bulletId, enemyId, damage }) => {
      const bullet = playerBullets.find((b) => b.id === bulletId)
      if (!bullet) return

      const enemy = enemyController.getEnemyById(enemyId)
      if (!enemy) return

      particleSystem.createHitEffect(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 6)

      const killed = enemyController.damageEnemy(enemyId, damage)

      bullet.active = false

      if (killed) {
        particleSystem.createExplosion(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2,
          25,
          '#ff6600'
        )
        ScreenEffects.shake(5, 0.2)
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
  <img
    class="enemy absolute pointer-events-none {getEnemyClass(enemy)}"
    src={getEnemySprite(enemy.type)}
    alt="Enemy {enemy.type}"
    style="left: {enemy.x}px; top: {enemy.y}px; width: {enemy.width}px; height: {enemy.height}px; transform: rotate(180deg);"
  />
{/each}

{#each enemyBullets as bullet (bullet.id)}
  <div
    class="enemy-bullet absolute pointer-events-none"
    style="left: {bullet.x}px; top: {bullet.y}px; width: {bullet.width}px; height: {bullet.height}px;"
  ></div>
{/each}

<style>
  .enemy {
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
    background: linear-gradient(to bottom, #ff0000, #ff6600);
    border-radius: 0 0 50% 50%;
    box-shadow: 0 0 8px #ff3333;
  }
</style>
