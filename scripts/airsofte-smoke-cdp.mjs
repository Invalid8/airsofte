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

      gameManager.currentWave = stressWave
      gameManager.waves = [stressWave]
      gameManager.currentWaveIndex = 98
      gameManager.session.currentWave = 99
      gameManager.player.health = gameManager.player.maxHealth
      gameManager.player.lives = 3
      gameManager.player.invincible = false
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
  assert(frameStats.canvas === true, 'Expected game canvas to render')
  assert(frameStats.p95Ms <= 35, `Expected p95 frame time <= 35ms, got ${frameStats.p95Ms}`)
  assert(runtimeErrors.length === 0, `Expected 0 runtime errors, got ${runtimeErrors.length}`)
  assert(
    stabilityAssertions.shieldBlocksStackedDamage === true,
    'Expected shield/invincibility to block stacked damage'
  )
  assert(stabilityAssertions.lifeDropsOnce === true, 'Expected one life loss per death')

  console.log(
    JSON.stringify(
      {
        bossResult,
        postStressState,
        frameStats,
        stabilityAssertions,
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
