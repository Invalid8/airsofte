<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type { Enemy, Bullet } from '$lib/types/gameTypes'
  import { EnemyController } from '$lib/game/enemyController'
  import { EnemySpawner } from '$lib/game/enemySpawner'
  import { gameManager } from '$lib/game/gameManager'
  import { gameEvents } from '$lib/game/eventBus'
  import { combatSystem } from '$lib/game/combatSystem'
  import { particleSystem } from '$lib/game/particleSystem'
  import { ScreenEffects } from '$lib/game/screenEffects'
  import { getBoundingBox } from '$lib/utils/collisionSystem'
  import { enhancedParticles } from '$lib/game/enhancedParticles'

  let {
    game_pad,
    playerBullets = $bindable([]),
    enemyBullets = $bindable([]),
    enemies = $bindable([]),
    playerX = 0,
    playerY = 0
  }: {
    game_pad: HTMLDivElement
    playerBullets?: Bullet[]
    enemyBullets?: Bullet[]
    enemies?: Enemy[]
    playerX?: number
    playerY?: number
  } = $props()

  let enemyController: EnemyController
  let enemySpawner: EnemySpawner
  let animationFrameId: number
  let lastFrameTime = 0

  function updateGame(now: number): void {
    const deltaMs = lastFrameTime ? Math.min(50, now - lastFrameTime) : 1000 / 60
    const deltaScale = deltaMs / (1000 / 60)
    lastFrameTime = now

    if (!gameManager.isPlaying) {
      animationFrameId = requestAnimationFrame(updateGame)
      return
    }

    if (gameManager.isPaused) {
      animationFrameId = requestAnimationFrame(updateGame)
      return
    }

    const bounds = getBoundingBox(0, 0, game_pad.clientWidth, game_pad.clientHeight)

    const newBullets = enemyController.updateEnemies(deltaMs, bounds, playerX, playerY)
    if (newBullets.length > 0) {
      enemyBullets.push(...newBullets)
    }

    let activeBulletCount = 0
    for (const bullet of enemyBullets) {
      if (!bullet.active) {
        enemyController.releaseBullet(bullet)
        continue
      }

      bullet.x += (bullet.vx || 0) * deltaScale
      bullet.y += (bullet.vy || bullet.speed) * deltaScale

      if (bullet.y > bounds.height + 30) {
        bullet.active = false
        enemyController.releaseBullet(bullet)
        continue
      }

      enemyBullets[activeBulletCount++] = bullet
    }
    enemyBullets.length = activeBulletCount
    enemyBullets = enemyBullets

    const activeEnemies = enemyController.getActiveEnemies()
    checkCollisions(activeEnemies)

    enemies = activeEnemies

    const boss = enemies.find((e) => e.type === 'BOSS')
    if (boss) {
      gameEvents.emit('BOSS_UPDATE', { enemy: boss })
    }

    animationFrameId = requestAnimationFrame(updateGame)
  }

  function checkCollisions(currentEnemies: Enemy[]): void {
    const visibleEnemies = currentEnemies.filter(
      (e) => e.y >= -100 && e.y <= game_pad.clientHeight + 100
    )
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

    const playerEnemyCollisions = combatSystem.checkPlayerEnemyCollisions(playerBox, currentEnemies)

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
    enemyBullets.forEach((bullet) => enemyController?.releaseBullet(bullet))
    enemyBullets = []
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

    if (gameManager.isPlaying && gameManager.currentWave && gameManager.session.currentWave > 1) {
      enemySpawner.startWave(gameManager.currentWave)
    }
  })

  onDestroy(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
    if (enemySpawner) {
      enemySpawner.stop()
    }
    enemyBullets.forEach((bullet) => enemyController?.releaseBullet(bullet))
    if (unsubWaveStart) unsubWaveStart()
    if (unsubGameStart) unsubGameStart()
  })
</script>
