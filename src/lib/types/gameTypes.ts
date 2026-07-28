export type Vector2D = {
  x: number
  y: number
}

export type BoundingBox = {
  x: number
  y: number
  width: number
  height: number
}

export type WeaponType = 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'SPREAD' | 'NOSE_CANNON' | 'SIDE_CANNONS'

export type EnemyType = 'BASIC' | 'SCOUT' | 'BOMBER' | 'BOSS'

export type PowerUpType =
  | 'HEALTH'
  | 'WEAPON'
  | 'SHIELD'
  | 'SPEED'
  | 'SCORE'
  | 'NOSE_CANNON'
  | 'SIDE_CANNONS'

export type MovementPattern =
  | 'STRAIGHT'
  | 'WAVE'
  | 'ZIGZAG'
  | 'CIRCLE'
  | 'CHASE'
  | 'TELEPORT'
  | 'SPIRAL'
  | 'DIAGONAL'

export type GameDifficulty = 'Easy' | 'Normal' | 'Hard'

export type Bullet = {
  id: string
  x: number
  y: number
  width: number
  height: number
  speed: number
  damage: number
  active: boolean
  owner: 'PLAYER' | 'ENEMY'
  type?: string
  vx?: number
  vy?: number
}

export type Enemy = {
  id: string
  type: EnemyType
  x: number
  y: number
  width: number
  height: number
  health: number
  maxHealth: number
  speed: number
  pattern: MovementPattern
  active: boolean
  shootInterval: number
  lastShot: number
  scoreValue: number
  patternData?: {
    amplitude?: number
    frequency?: number
    startX?: number
    startY?: number
    angle?: number
    radius?: number
    opacity?: number
    scale?: number
    bossPhaseId?: string
    teleportState?: {
      isTeleporting: boolean
      teleportProgress: number
      targetX: number
      targetY: number
      portalEffect: boolean
      lastTeleport: number
      teleportCooldown: number
    }
  }
}

export type PowerUp = {
  id: string
  type: PowerUpType
  x: number
  y: number
  width: number
  height: number
  speed: number
  active: boolean
  value: number
}

export type PlayerStats = {
  health: number
  maxHealth: number
  lives: number
  speed: number
  fireRate: number
  weaponType: WeaponType
  shieldActive: boolean
  invincible: boolean
  invincibleUntil: number
}

export type Wave = {
  id: number
  enemies: Array<{
    type: EnemyType
    count: number
    spawnDelay: number
    pattern: MovementPattern
  }>
  spawnInterval: number
  completed: boolean
}

export type GameSessionState = {
  playing: boolean
  score: number
  currentWave: number
  enemiesDefeated: number
  bulletsShot: number
  accuracy: number
  timeElapsed: number
  comboMultiplier: number
  comboTimer: number
}

export type HighScore = {
  name: string
  score: number
  wave: number
  difficulty: GameDifficulty
  date: number
  mode: 'QUICK_PLAY' | 'STORY_MODE'
}

export type MissionStars = 0 | 1 | 2 | 3 | number

export type MissionEventPreset = {
  id: string
  type:
    | 'REINFORCEMENTS'
    | 'SUPPLY_DROP'
    | 'ALLY_SUPPORT'
    | 'ENEMY_RETREAT'
    | 'HAZARD_INCOMING'
    | 'BONUS_OBJECTIVE'
  triggerTime?: number
  triggerCondition?: 'WAVE_START' | 'WAVE_END' | 'ENEMIES_REMAINING' | 'HEALTH_LOW' | 'TIME_ELAPSED'
  conditionValue?: number
  data?: any
}

export type StoryMission = {
  id: number
  title: string
  description: string
  unlocked: boolean
  completed: boolean
  stars?: MissionStars
  objectives: Array<{
    type: 'DESTROY' | 'SURVIVE' | 'PROTECT' | 'COLLECT' | 'NO_DAMAGE' | 'COMBO'
    target: number
    current: number
    description: string
    enemyType?: EnemyType
  }>
  waves: Wave[]
  dialogue?: Array<{
    character: string
    text: string
    timing: 'START' | 'MID' | 'END'
  }>
  events?: MissionEventPreset[]
  hasBoss: boolean
  bossConfig?: BossConfig
  rewards?: {
    unlockWeapon?: WeaponType
    scoreMultiplier?: number
    bonusPoints?: number
  }
}

export type BossConfig = {
  type: EnemyType
  health: number
  phases: Array<{
    healthThreshold: number
    pattern: MovementPattern
    attackPattern: string
    speed: number
  }>
  scoreValue: number
}

export type BossAttackPreset = {
  id: string
  healthThreshold: number
  bulletCount: number
  spread: number
  intervalMultiplier: number
  speedMultiplier: number
  aimed: boolean
  movementPattern: MovementPattern
  minY: number
  maxY: number
}

export type SaveGame = {
  playerProgress: {
    storyMissions: StoryMission[]
    unlockedWeapons: WeaponType[]
    totalScore: number
    achievements: string[]
  }
  settings: GameSettings
  highScores: {
    quickPlay: HighScore[]
    storyMode: HighScore[]
  }
  lastPlayed: number
}

export type GameSettings = {
  volume: {
    master: number
    music: number
    sfx: number
  }
  difficulty: GameDifficulty
  keyBindings: {
    up: string
    down: string
    left: string
    right: string
    shoot: string
    special: string
    pause: string
  }
  graphics: {
    particles: boolean
    screenShake: boolean
    showFPS: boolean
  }
}

export type CollisionResult = {
  collided: boolean
  objects: Array<{ id: string; type: string }>
}

export type GameEvent = {
  type:
    | 'ENEMY_DESTROYED'
    | 'ENEMY_ESCAPED'
    | 'PLAYER_HIT'
    | 'PLAYER_DEATH'
    | 'PLAYER_RESPAWN'
    | 'PLAYER_HEALED'
    | 'PLAYER_STATE_CHANGED'
    | 'LIFE_GAINED'
    | 'SHIELD_ACTIVATED'
    | 'SHIELD_BROKEN'
    | 'SHIELD_DEACTIVATED'
    | 'WEAPON_CHANGED'
    | 'WEAPON_EXPIRED'
    | 'SPEED_BOOST_ACTIVATED'
    | 'SPEED_BOOST_EXPIRED'
    | 'POWERUP_SPAWNED'
    | 'POWERUP_COLLECTED'
    | 'WAVE_COMPLETE'
    | 'BOSS_DEFEATED'
    | 'GAME_OVER'
    | 'GAME_START'
    | 'GAME_PAUSED'
    | 'GAME_RESUMED'
    | 'ENEMY_SPAWNED'
    | 'BOSS_UPDATE'
    | 'WAVE_START'
    | 'OBJECTIVE_UPDATED'
    | 'OBJECTIVE_COMPLETED'
    | 'OBJECTIVE_FAILED'
    | 'BONUS_OBJECTIVE_ADDED'
    | 'BONUS_OBJECTIVE_COMPLETED'
    | 'ADD_BONUS_OBJECTIVE'
    | 'COMBO_UPDATED'
    | 'COMBO_RESET'
    | 'SHOW_MESSAGE'
    | 'SPAWN_REINFORCEMENTS'
    | 'CLEAR_ENEMY_BULLETS'
    | 'ENEMY_RETREAT'
    | 'SPAWN_POWERUP'
    | 'MISSION_EVENT'
    | 'RUNTIME_FRAME'
  data?: any
  timestamp: number
}

export type WaveTemplate = {
  id: number
  spawnInterval: number
  enemies: ReadonlyArray<{
    type: EnemyType
    count: number
    spawnDelay: number
    pattern: MovementPattern
  }>
}

export type WaveInstance = {
  id: number
  enemies: {
    type: EnemyType
    count: number
    spawnDelay: number
    pattern: MovementPattern
  }[]
  spawnInterval: number
  completed: boolean
}
