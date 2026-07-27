const CDP_HOST = process.env.CDP_HOST ?? '127.0.0.1'
const CDP_PORT = Number(process.env.CDP_PORT ?? 9223)
const APP_URL = process.env.APP_URL ?? 'http://127.0.0.1:1420/'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function getPageWebSocketUrl() {
  const pages = await fetch(`http://${CDP_HOST}:${CDP_PORT}/json`).then((response) =>
    response.json()
  )
  const page = pages.find((entry) => entry.type === 'page') ?? pages[0]
  if (!page?.webSocketDebuggerUrl) {
    throw new Error('No debuggable Chrome page found')
  }
  return page.webSocketDebuggerUrl
}

function createCdpClient(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl)
  let nextId = 1
  const pending = new Map()
  const events = []

  socket.addEventListener('message', (message) => {
    const payload = JSON.parse(message.data)
    if (payload.id && pending.has(payload.id)) {
      const { resolve, reject } = pending.get(payload.id)
      pending.delete(payload.id)
      if (payload.error) reject(new Error(payload.error.message))
      else resolve(payload.result)
      return
    }
    events.push(payload)
  })

  const ready = new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })

  function send(method, params = {}) {
    const id = nextId++
    socket.send(JSON.stringify({ id, method, params }))
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject })
    })
  }

  return { ready, send, events, close: () => socket.close() }
}

async function evaluate(client, expression, timeout = 5000) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    timeout
  })

  if (result.exceptionDetails) {
    const details = result.exceptionDetails
    const exception = details.exception
    throw new Error(
      [
        details.text ?? 'Runtime evaluation failed',
        exception?.description,
        exception?.value
      ].filter(Boolean).join('\n')
    )
  }

  return result.result?.value
}

async function waitFor(client, expression, timeout = 10000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const value = await evaluate(client, expression)
    if (value) return value
    await sleep(200)
  }
  const bodyText = await evaluate(
    client,
    'document.body?.innerText?.slice(0, 1000) ?? document.documentElement?.outerHTML?.slice(0, 1000) ?? ""'
  ).catch(() => '')
  throw new Error(`Timed out waiting for: ${expression}\nVisible text/html:\n${bodyText}`)
}

async function main() {
  const client = createCdpClient(await getPageWebSocketUrl())
  await client.ready

  await client.send('Page.enable')
  await client.send('Runtime.enable')
  await client.send('Log.enable')

  await client.send('Page.navigate', { url: APP_URL })
  await waitFor(client, 'document.readyState === "complete"')

  await evaluate(
    client,
    `localStorage.clear(); sessionStorage.clear(); location.href = ${JSON.stringify(APP_URL)}; true`
  )
  await sleep(1000)

  await waitFor(
    client,
    `document.body?.innerText.toLowerCase().includes("select player") ||
      document.body?.innerText.toLowerCase().includes("main menu")`,
    15000
  )

  const isSelectingUser = await evaluate(
    client,
    'document.body?.innerText.toLowerCase().includes("select player")'
  )
  if (isSelectingUser) {
    await evaluate(
      client,
      `[...document.querySelectorAll('button')]
        .find((button) => button.textContent?.includes('Play as Guest'))
        ?.click();
      true`
    )
    await waitFor(client, 'document.body?.innerText.toLowerCase().includes("main menu")', 10000)
  }
  await evaluate(
    client,
    `[...document.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Start Game'))
      ?.click();
    true`
  )

  await waitFor(client, 'document.body?.innerText.toLowerCase().includes("quick game")', 10000)
  await evaluate(
    client,
    `[...document.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Quick Game'))
      ?.click();
    true`
  )

  await waitFor(client, 'Boolean(document.querySelector("canvas"))', 10000)
  await sleep(2000)

  const waveProgressionAssertions = await evaluate(
    client,
    `(async () => {
      const { gameManager } = await import('/src/lib/game/gameManager.ts')

      gameManager.mode = 'QUICK_PLAY'
      gameManager.difficulty = 'Normal'
      gameManager.currentWaveIndex = 1
      gameManager.session.currentWave = 2
      gameManager.waveCompleting = false

      gameManager.nextQuickPlayWave()
      const waveAfterSecond = gameManager.session.currentWave
      const waveThreeEnemyGroups = gameManager.currentWave?.enemies.length ?? 0

      gameManager.nextQuickPlayWave()
      const waveAfterThird = gameManager.session.currentWave
      const waveFourEnemyGroups = gameManager.currentWave?.enemies.length ?? 0

      return {
        waveAfterSecond,
        waveThreeEnemyGroups,
        waveAfterThird,
        waveFourEnemyGroups
      }
    })()`
  )

  const bossResult = await evaluate(
    client,
    `(async () => {
      const { gameManager } = await import('/src/lib/game/gameManager.ts')
      const { gameEvents } = await import('/src/lib/game/eventBus.ts')
      const { GAME_CONFIG } = await import('/src/lib/config/gameConstants.ts')
      const { BOSS_ATTACK_PRESETS, ENEMY_CONFIG } = await import('/src/lib/game/presets/index.ts')

      ENEMY_CONFIG.BOSS.shootInterval = 80
      ENEMY_CONFIG.BOSS.health = 900

      const stressWave = {
        id: 99,
        completed: false,
        spawnInterval: 100,
        enemies: [
          { type: 'BOSS', count: 1, spawnDelay: 0, pattern: 'CIRCLE' },
          { type: 'SCOUT', count: 12, spawnDelay: 100, pattern: 'ZIGZAG' }
        ]
      }

      gameEvents.emit('GAME_START', { mode: 'SMOKE_STRESS' })

      gameManager.isPlaying = true
      gameManager.isPaused = false
      gameManager.currentWave = stressWave
      gameManager.waves = [stressWave]
      gameManager.currentWaveIndex = 98
      gameManager.session.playing = true
      gameManager.session.currentWave = 99
      gameManager.player.health = gameManager.player.maxHealth
      gameManager.player.lives = 3
      gameManager.player.invincible = true
      gameManager.player.shieldActive = false
      gameManager.enemiesSpawned = 13
      gameManager.enemiesDestroyedInWave = 0
      gameManager.waveCompleting = false
      gameEvents.emit('WAVE_START', { wave: 99, hasBoss: true })

      return {
        playing: gameManager.isPlaying,
        wave: gameManager.session.currentWave,
        lives: gameManager.player.lives,
        health: gameManager.player.health,
        bossPresetCount: BOSS_ATTACK_PRESETS.length,
        enemyBulletLimit: GAME_CONFIG.LIMITS.ENEMY_BULLETS,
        playerBulletLimit: GAME_CONFIG.LIMITS.PLAYER_BULLETS
      }
    })()`
  )

  await sleep(5000)

  const frameStats = await evaluate(
    client,
    `new Promise((resolve) => {
      const samples = []
      let last = performance.now()
      function tick(now) {
        samples.push(now - last)
        last = now
        if (samples.length < 180) {
          requestAnimationFrame(tick)
          return
        }
        const sorted = [...samples].sort((a, b) => a - b)
        resolve({
          samples: samples.length,
          averageMs: samples.reduce((sum, value) => sum + value, 0) / samples.length,
          p95Ms: sorted[Math.floor(sorted.length * 0.95)],
          maxMs: Math.max(...samples),
          canvas: Boolean(document.querySelector('canvas')),
          text: document.body.innerText.slice(0, 300)
        })
      }
      requestAnimationFrame(tick)
    })`,
    10000
  )

  const postStressState = await evaluate(
    client,
    `(async () => {
      const { gameManager } = await import('/src/lib/game/gameManager.ts')
      return {
        playing: gameManager.isPlaying,
        wave: gameManager.session.currentWave,
        lives: gameManager.player.lives,
        health: gameManager.player.health,
        shieldActive: gameManager.player.shieldActive,
        invincible: gameManager.player.invincible,
        runtimeStats: window.__AIRSOFTE_RUNTIME_STATS__ ?? null
      }
    })()`
  )

  const runtimeEventAssertions = await evaluate(
    client,
    `(async () => {
      const { gameEvents } = await import('/src/lib/game/eventBus.ts')

      gameEvents.emit('CLEAR_ENEMY_BULLETS', {})
      const bulletsAfterClear = window.__AIRSOFTE_RUNTIME_STATS__?.activeEnemyBullets ?? -1

      gameEvents.emit('SPAWN_REINFORCEMENTS', {
        enemyType: 'SCOUT',
        count: 3,
        pattern: 'ZIGZAG'
      })
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const enemiesAfterReinforcements = window.__AIRSOFTE_RUNTIME_STATS__?.activeEnemies ?? 0

      gameEvents.emit('ENEMY_RETREAT', { clearAll: true })
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const enemiesAfterRetreat = window.__AIRSOFTE_RUNTIME_STATS__?.activeEnemies ?? -1

      gameEvents.emit('SPAWN_REINFORCEMENTS', {
        enemyType: 'BOSS',
        count: 1,
        pattern: 'CIRCLE'
      })
      const bossVisibleAfterSpawn = window.__AIRSOFTE_RUNTIME_STATS__?.bossHealthVisible === true
      const bossHealthAfterSpawn = window.__AIRSOFTE_RUNTIME_STATS__?.bossHealth ?? 0

      gameEvents.emit('ENEMY_RETREAT', { clearAll: true })
      const bossVisibleAfterRetreat = window.__AIRSOFTE_RUNTIME_STATS__?.bossHealthVisible === true

      return {
        bulletsAfterClear,
        enemiesAfterReinforcements,
        enemiesAfterRetreat,
        bossVisibleAfterSpawn,
        bossHealthAfterSpawn,
        bossVisibleAfterRetreat,
        finalStats: window.__AIRSOFTE_RUNTIME_STATS__ ?? null
      }
    })()`
  )

  const contactCollisionAssertions = await evaluate(
    client,
    `(async () => {
      const { gameEvents } = await import('/src/lib/game/eventBus.ts')
      const { gameManager } = await import('/src/lib/game/gameManager.ts')
      const { gameRuntimeState } = await import('/src/lib/game/gameRuntime.ts')

      if (gameManager.invincibilityTimeoutId) {
        clearTimeout(gameManager.invincibilityTimeoutId)
        gameManager.invincibilityTimeoutId = null
      }

      gameEvents.emit('ENEMY_RETREAT', { clearAll: true })
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

      gameManager.isPlaying = true
      gameManager.playerDown = false
      gameManager.player.health = 100
      gameManager.player.lives = 3
      gameManager.player.invincible = false
      gameManager.player.shieldActive = false

      gameEvents.emit('SPAWN_REINFORCEMENTS', {
        enemyType: 'BOMBER',
        count: 1,
        pattern: 'STRAIGHT',
        x: gameRuntimeState.playerX + 15,
        y: gameRuntimeState.playerY + 15
      })

      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

      const bomberAfterFirstContact = gameRuntimeState.enemies.find((enemy) => enemy.type === 'BOMBER')
      const healthAfterFirstContact = gameManager.player.health
      const livesAfterFirstContact = gameManager.player.lives
      const bomberHealthAfterFirstContact = bomberAfterFirstContact?.health ?? 0
      const bomberMaxHealth = bomberAfterFirstContact?.maxHealth ?? 0
      const bomberStillActive = bomberAfterFirstContact?.active === true

      await new Promise((resolve) => {
        let frames = 0
        function tick() {
          frames++
          if (frames >= 12) resolve()
          else requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })

      return {
        healthAfterFirstContact,
        healthAfterCooldownWindow: gameManager.player.health,
        livesAfterFirstContact,
        bomberStillActive,
        bomberHealthAfterFirstContact,
        bomberMaxHealth
      }
    })()`
  )

  const stabilityAssertions = await evaluate(
    client,
    `(async () => {
      const { gameManager } = await import('/src/lib/game/gameManager.ts')

      if (gameManager.invincibilityTimeoutId) {
        clearTimeout(gameManager.invincibilityTimeoutId)
        gameManager.invincibilityTimeoutId = null
      }

      gameManager.isPlaying = true
      gameManager.playerDown = false
      gameManager.player.health = 100
      gameManager.player.lives = 3
      gameManager.player.invincible = false
      gameManager.player.shieldActive = true
      gameManager.damagePlayer(20)
      gameManager.damagePlayer(20)

      const shieldBlocksStackedDamage =
        gameManager.player.health === 100 &&
        gameManager.player.lives === 3 &&
        gameManager.player.shieldActive === false &&
        gameManager.player.invincible === true

      if (gameManager.invincibilityTimeoutId) {
        clearTimeout(gameManager.invincibilityTimeoutId)
        gameManager.invincibilityTimeoutId = null
      }

      gameManager.playerDown = false
      gameManager.player.health = 10
      gameManager.player.lives = 3
      gameManager.player.invincible = false
      gameManager.player.shieldActive = false
      gameManager.damagePlayer(30)
      gameManager.damagePlayer(30)

      const lifeDropsOnce =
        gameManager.player.lives === 2 &&
        gameManager.player.health === 0 &&
        gameManager.playerDown === true

      return {
        shieldBlocksStackedDamage,
        lifeDropsOnce,
        livesAfterStackedDeath: gameManager.player.lives
      }
    })()`
  )

  const respawnRuntimeAssertions = await evaluate(
    client,
    `(async () => {
      const { gameManager } = await import('/src/lib/game/gameManager.ts')
      const beforeFrameAt = window.__AIRSOFTE_RUNTIME_STATS__?.lastFrameAt ?? 0

      await new Promise((resolve) => setTimeout(resolve, 2200))

      const afterFrameAt = window.__AIRSOFTE_RUNTIME_STATS__?.lastFrameAt ?? 0

      return {
        playing: gameManager.isPlaying,
        lives: gameManager.player.lives,
        health: gameManager.player.health,
        playerDown: gameManager.playerDown,
        frameAdvanced: afterFrameAt > beforeFrameAt
      }
    })()`,
    5000
  )

  const deterministicSystemAssertions = await evaluate(
    client,
    `(async () => {
      const { gameManager } = await import('/src/lib/game/gameManager.ts')
      const { gameEvents } = await import('/src/lib/game/eventBus.ts')
      const { PlayerController } = await import('/src/lib/game/playerController.ts')
      const { EnemyController } = await import('/src/lib/game/enemyController.ts')
      const { powerUpSystem } = await import('/src/lib/game/powerUpSystem.ts')
      const { storyMissionManager } = await import('/src/lib/game/storyMissionData.ts')
      const { getBoundingBox } = await import('/src/lib/utils/collisionSystem.ts')

      const originalWeapon = gameManager.player.weaponType
      const originalFireRate = gameManager.player.fireRate
      const originalWaveCompleting = gameManager.waveCompleting

      gameManager.isPlaying = true
      gameManager.isPaused = false
      gameManager.session.bulletsShot = 0
      gameManager.player.weaponType = 'SPREAD'
      gameManager.player.fireRate = 0

      const playerController = new PlayerController(120, 420)
      const playerBullets = playerController.shoot()
      const playerShooting = {
        bulletCount: playerBullets.length,
        bulletsShot: gameManager.session.bulletsShot,
        allOwnedByPlayer: playerBullets.every((bullet) => bullet.owner === 'PLAYER' && bullet.active)
      }
      playerBullets.forEach((bullet) => playerController.releaseBullet(bullet))

      powerUpSystem.clearAll()
      gameManager.player.health = 50
      let collectedPowerUp = null
      const unsubPowerUp = gameEvents.on('POWERUP_COLLECTED', (event) => {
        collectedPowerUp = event.data
      })
      powerUpSystem.spawnPowerUp('HEALTH', 40, 40)
      const collected = powerUpSystem.checkPlayerCollision(getBoundingBox(35, 35, 120, 120))
      unsubPowerUp()
      const powerUpPickup = {
        collectedType: collected?.type ?? null,
        eventType: collectedPowerUp?.type ?? null,
        healthAfterPickup: gameManager.player.health,
        activePowerUpsAfterPickup: powerUpSystem.getActivePowerUps().length
      }

      let bossDefeatedEvent = null
      const unsubBossDefeated = gameEvents.on('BOSS_DEFEATED', (event) => {
        bossDefeatedEvent = event.data
      })
      gameManager.waveCompleting = true
      const enemyController = new EnemyController()
      const boss = enemyController.spawnEnemy('BOSS', 160, 80, 'CIRCLE')
      const bossKilled = enemyController.damageEnemy(boss.id, boss.maxHealth)
      unsubBossDefeated()
      const bossDefeat = {
        bossKilled,
        eventEnemyType: bossDefeatedEvent?.enemy?.type ?? null,
        bossActiveAfterDefeat: boss.active
      }

      const firstMission = storyMissionManager.getMissionById(1)
      const secondMissionBefore = storyMissionManager.getMissionById(2)
      storyMissionManager.completeMission(1, 3)
      const firstMissionAfter = storyMissionManager.getMissionById(1)
      const secondMissionAfter = storyMissionManager.getMissionById(2)
      const storyMissionCompletion = {
        hadMissionOne: Boolean(firstMission),
        missionOneCompleted: firstMissionAfter?.completed === true,
        missionOneStars: firstMissionAfter?.stars ?? 0,
        missionTwoUnlockedBefore: secondMissionBefore?.unlocked ?? null,
        missionTwoUnlockedAfter: secondMissionAfter?.unlocked ?? null
      }

      let gameOverEvent = null
      const unsubGameOver = gameEvents.on('GAME_OVER', (event) => {
        gameOverEvent = event.data
      })
      gameManager.mode = 'QUICK_PLAY'
      gameManager.session.score = 4321
      gameManager.session.currentWave = 7
      gameManager.endGame(false)
      await new Promise((resolve) => setTimeout(resolve, 700))
      unsubGameOver()
      const gameOver = {
        eventReceived: gameOverEvent !== null,
        victory: gameOverEvent?.victory ?? null,
        score: gameOverEvent?.score ?? null,
        wave: gameOverEvent?.wave ?? null,
        managerStopped: gameManager.isPlaying === false
      }

      gameManager.player.weaponType = originalWeapon
      gameManager.player.fireRate = originalFireRate
      gameManager.waveCompleting = originalWaveCompleting
      powerUpSystem.clearAll()

      return {
        playerShooting,
        powerUpPickup,
        bossDefeat,
        storyMissionCompletion,
        gameOver
      }
    })()`,
    5000
  )

  const runtimeErrors = client.events
    .filter(
      (event) =>
        event.method === 'Runtime.exceptionThrown' ||
        (event.method === 'Log.entryAdded' && event.params?.entry?.level === 'error')
    )
    .map((event) => event.params)

  assert(bossResult.playing === true, 'Expected game to be playing during stress wave')
  assert(bossResult.wave === 99, 'Expected forced stress wave 99')
  assert(bossResult.bossPresetCount >= 3, 'Expected boss attack presets to be configured')
  assert(bossResult.enemyBulletLimit > 0, 'Expected enemy bullet limit to be configured')
  assert(bossResult.playerBulletLimit > 0, 'Expected player bullet limit to be configured')
  assert(waveProgressionAssertions.waveAfterSecond === 3, 'Expected quick play to advance from wave 2 to 3')
  assert(waveProgressionAssertions.waveAfterThird === 4, 'Expected quick play to continue from wave 3 to 4')
  assert(waveProgressionAssertions.waveThreeEnemyGroups > 0, 'Expected wave 3 to configure enemy groups')
  assert(waveProgressionAssertions.waveFourEnemyGroups > 0, 'Expected wave 4 to configure enemy groups')
  assert(postStressState.playing === true, 'Expected game to survive stress wave')
  assert(postStressState.lives >= 1, 'Expected player to survive stress wave')
  assert(postStressState.runtimeStats !== null, 'Expected runtime stats to be published')
  assert(
    postStressState.runtimeStats.activeEnemyBullets <= bossResult.enemyBulletLimit,
    'Expected enemy bullet count to stay within configured cap'
  )
  assert(
    postStressState.runtimeStats.activePlayerBullets <= bossResult.playerBulletLimit,
    'Expected player bullet count to stay within configured cap'
  )
  assert(runtimeEventAssertions.bulletsAfterClear === 0, 'Expected clear-bullets event to empty enemy bullets')
  assert(
    runtimeEventAssertions.enemiesAfterReinforcements >= 3,
    'Expected reinforcement event to spawn enemies'
  )
  assert(runtimeEventAssertions.enemiesAfterRetreat === 0, 'Expected retreat event to clear enemies')
  assert(
    runtimeEventAssertions.bossVisibleAfterSpawn === true,
    `Expected boss health to show for a live boss: ${JSON.stringify(runtimeEventAssertions)}`
  )
  assert(runtimeEventAssertions.bossHealthAfterSpawn > 0, 'Expected spawned boss to have health')
  assert(runtimeEventAssertions.bossVisibleAfterRetreat === false, 'Expected boss health to hide after boss retreat')
  assert(
    contactCollisionAssertions.healthAfterFirstContact === 70,
    `Expected contact to apply one player hit, got ${JSON.stringify(contactCollisionAssertions)}`
  )
  assert(
    contactCollisionAssertions.healthAfterCooldownWindow === contactCollisionAssertions.healthAfterFirstContact,
    'Expected contact cooldown to prevent stacked collision damage'
  )
  assert(contactCollisionAssertions.livesAfterFirstContact === 3, 'Expected contact hit not to cost a life')
  assert(contactCollisionAssertions.bomberStillActive === true, 'Expected high-health enemy to survive contact')
  assert(
    contactCollisionAssertions.bomberHealthAfterFirstContact > 0 &&
      contactCollisionAssertions.bomberHealthAfterFirstContact < contactCollisionAssertions.bomberMaxHealth,
    'Expected contact to damage, not one-shot, a high-health enemy'
  )
  assert(frameStats.canvas === true, 'Expected game canvas to render')
  assert(frameStats.p95Ms <= 35, `Expected p95 frame time <= 35ms, got ${frameStats.p95Ms}`)
  assert(runtimeErrors.length === 0, `Expected 0 runtime errors, got ${runtimeErrors.length}`)
  assert(
    stabilityAssertions.shieldBlocksStackedDamage === true,
    'Expected shield/invincibility to block stacked damage'
  )
  assert(stabilityAssertions.lifeDropsOnce === true, 'Expected one life loss per death')
  assert(respawnRuntimeAssertions.playing === true, 'Expected game to keep playing after respawn')
  assert(respawnRuntimeAssertions.lives === 2, 'Expected respawn to continue on second life')
  assert(respawnRuntimeAssertions.health === 100, 'Expected player health to reset after respawn')
  assert(respawnRuntimeAssertions.playerDown === false, 'Expected playerDown to clear after respawn')
  assert(respawnRuntimeAssertions.frameAdvanced === true, 'Expected runtime frames to advance after respawn')
  assert(deterministicSystemAssertions.playerShooting.bulletCount >= 3, 'Expected player spread shooting to create bullets')
  assert(deterministicSystemAssertions.playerShooting.bulletsShot === 1, 'Expected player shooting to update shot count')
  assert(
    deterministicSystemAssertions.playerShooting.allOwnedByPlayer === true,
    'Expected player bullets to be active and player-owned'
  )
  assert(deterministicSystemAssertions.powerUpPickup.collectedType === 'HEALTH', 'Expected health power-up pickup')
  assert(deterministicSystemAssertions.powerUpPickup.eventType === 'HEALTH', 'Expected power-up collected event')
  assert(deterministicSystemAssertions.powerUpPickup.healthAfterPickup > 50, 'Expected power-up to heal player')
  assert(
    deterministicSystemAssertions.powerUpPickup.activePowerUpsAfterPickup === 0,
    'Expected collected power-up to leave active pool'
  )
  assert(deterministicSystemAssertions.bossDefeat.bossKilled === true, 'Expected boss defeat damage to kill boss')
  assert(deterministicSystemAssertions.bossDefeat.eventEnemyType === 'BOSS', 'Expected boss defeat event')
  assert(deterministicSystemAssertions.bossDefeat.bossActiveAfterDefeat === false, 'Expected boss inactive after defeat')
  assert(
    deterministicSystemAssertions.storyMissionCompletion.hadMissionOne === true,
    'Expected story mission one to exist'
  )
  assert(
    deterministicSystemAssertions.storyMissionCompletion.missionOneCompleted === true,
    'Expected story mission completion to persist in manager'
  )
  assert(deterministicSystemAssertions.storyMissionCompletion.missionOneStars === 3, 'Expected story stars to update')
  assert(
    deterministicSystemAssertions.storyMissionCompletion.missionTwoUnlockedAfter === true,
    'Expected completing mission one to unlock mission two'
  )
  assert(deterministicSystemAssertions.gameOver.eventReceived === true, 'Expected game over event')
  assert(deterministicSystemAssertions.gameOver.victory === false, 'Expected quick-play game over to be non-victory')
  assert(deterministicSystemAssertions.gameOver.score === 4321, 'Expected game over score payload')
  assert(deterministicSystemAssertions.gameOver.wave === 7, 'Expected game over wave payload')
  assert(deterministicSystemAssertions.gameOver.managerStopped === true, 'Expected game manager to stop on game over')

  console.log(
    JSON.stringify(
      {
        bossResult,
        waveProgressionAssertions,
        postStressState,
        frameStats,
        runtimeEventAssertions,
        contactCollisionAssertions,
        stabilityAssertions,
        respawnRuntimeAssertions,
        deterministicSystemAssertions,
        runtimeErrorCount: runtimeErrors.length,
        runtimeErrors: runtimeErrors.slice(0, 5)
      },
      null,
      2
    )
  )

  client.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
